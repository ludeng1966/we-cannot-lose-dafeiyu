/* Browser-only segmented narration player. No concatenation or export.
 * new NarrationAudioTimeline(manifest,{onState,onError}); await play();
 * paused is the user's playback intent; buffering is reported through onState.
 * A short declared total is extended to the final group end, never truncating it.
 */
(function (root) {
  'use strict';
  const EPS = 1e-6, TOLERANCE = .03, LEAD = .02;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const cancelled = () => Object.assign(new Error('Narration operation cancelled'), { name: 'AbortError' });
  class NarrationAudioTimeline {
    constructor(manifest, options = {}) {
      if (!manifest || !Array.isArray(manifest.groups)) throw new TypeError('Narration manifest.groups must be an array');
      const declared = Number(manifest.duration);
      if (!Number.isFinite(declared) || declared < 0) throw new TypeError('Narration duration must be nonnegative');
      const ids = new Set();
      this.groups = manifest.groups.map((g, i) => {
        const row = { id: String(g.id == null ? '' : g.id), start: Number(g.start), end: Number(g.end),
          sourceUrl: String(g.sourceUrl || ''), sourceOffset: Number(g.sourceOffset || 0) };
        if (!row.id || ids.has(row.id)) throw new Error('Missing or duplicate narration group id at ' + i);
        ids.add(row.id);
        if (!Number.isFinite(row.start) || !Number.isFinite(row.end) || row.start < 0 || row.end <= row.start ||
            !Number.isFinite(row.sourceOffset) || row.sourceOffset < 0 || !row.sourceUrl)
          throw new Error('Invalid narration group ' + row.id);
        return Object.freeze(row);
      }).sort((a, b) => a.start - b.start);
      for (let i = 1; i < this.groups.length; i++)
        if (this.groups[i].start < this.groups[i - 1].end - EPS)
          throw new Error('Overlapping narration groups: ' + this.groups[i - 1].id + ' / ' + this.groups[i].id);
      this.declaredDuration = declared;
      this.duration = Math.max(declared, this.groups.length ? this.groups[this.groups.length - 1].end : 0);
      this._onState = typeof options.onState === 'function' ? options.onState : null;
      this._onError = typeof options.onError === 'function' ? options.onError : null;
      this._ctx = null; this._analyser = null; this._samples = null;
      this._cache = new Map(); this._failures = new Map(); this._allowed = new Set();
      this._scheduled = new Map(); this._token = 0; this._timer = null; this._resumeTask = null;
      this._position = 0; this._baseGlobal = 0; this._baseContext = 0; this._limit = 0;
      this._running = false; this._wantPlaying = false; this._destroyed = false;
      this._state = 'paused'; this._lastNotify = 0; this._energy = 0;
      this._window(0);
    }
    get paused() { return !this._wantPlaying; }
    get currentTime() {
      if (!this._running || !this._ctx) return this._position;
      return clamp(this._rawTime(), this._position, Math.min(this.duration, this._limit));
    }
    get energy() {
      if (!this._running || this._ctx?.state !== 'running' || !this._analyser) return 0;
      this._analyser.getFloatTimeDomainData(this._samples);
      let sum = 0; for (const v of this._samples) sum += v * v;
      const next = clamp(Math.sqrt(sum / this._samples.length) * 4, 0, 1);
      this._energy = this._energy * .55 + next * .45;
      return this._energy;
    }
    _assert() { if (this._destroyed) throw new Error('NarrationAudioTimeline has been destroyed'); }
    _context() {
      this._assert();
      if (this._ctx) return this._ctx;
      const AudioContext = root.AudioContext || root.webkitAudioContext;
      if (!AudioContext) throw new Error('Web Audio is unavailable in this browser');
      this._ctx = new AudioContext();
      this._analyser = this._ctx.createAnalyser();
      this._analyser.fftSize = 1024; this._analyser.smoothingTimeConstant = .25;
      this._samples = new Float32Array(this._analyser.fftSize);
      this._analyser.connect(this._ctx.destination);
      this._ctx.onstatechange = () => this._kick();
      return this._ctx;
    }
    async unlock() {
      const ctx = this._context();
      if (ctx.state === 'closed') throw new Error('Narration AudioContext is closed');
      if (ctx.state !== 'running') await ctx.resume();
      this._assert();
    }
    _cursor(t) {
      let lo = 0, hi = this.groups.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (this.groups[mid].end <= t + EPS) lo = mid + 1; else hi = mid; }
      return lo;
    }
    _active(t) {
      const i = this._cursor(t), g = this.groups[i];
      return g && g.start <= t + EPS && t < g.end - EPS ? i : -1;
    }
    _window(t) {
      const cursor = this._cursor(t), pivot = Math.min(cursor, this.groups.length - 1);
      const allowed = new Set([pivot - 1, pivot, pivot + 1].filter(i => i >= 0 && i < this.groups.length));
      this._allowed = allowed;
      for (const [i, entry] of this._cache) if (!allowed.has(i)) {
        entry.controller.abort(); this._cache.delete(i);
      }
      for (const i of this._failures.keys()) if (!allowed.has(i)) this._failures.delete(i);
      return cursor;
    }
    _groupError(g, message, cause) {
      const error = new Error('Narration group "' + g.id + '": ' + message);
      error.groupId = g.id; if (cause) error.cause = cause;
      return error;
    }
    _load(i) {
      const cached = this._cache.get(i);
      if (cached) return cached.promise;
      if (this._failures.has(i)) return Promise.reject(this._failures.get(i));
      const g = this.groups[i], ctx = this._context();
      if (!g || !this._allowed.has(i)) return Promise.reject(cancelled());
      const controller = new (root.AbortController || AbortController)();
      const entry = { controller, buffer: null, promise: null };
      this._cache.set(i, entry);
      entry.promise = (async () => {
        const response = await root.fetch(g.sourceUrl, { signal: controller.signal });
        if (!response.ok) throw this._groupError(g, 'HTTP ' + response.status + ' loading ' + g.sourceUrl);
        const bytes = await response.arrayBuffer();
        if (controller.signal.aborted) throw cancelled();
        const buffer = await ctx.decodeAudioData(bytes);
        if (this._destroyed || this._cache.get(i) !== entry || !this._allowed.has(i)) throw cancelled();
        const available = buffer.duration - g.sourceOffset, needed = g.end - g.start;
        if (!Number.isFinite(buffer.duration) || available < -EPS || needed > available + TOLERANCE)
          throw this._groupError(g, 'timeline requests ' + needed.toFixed(6) + 's at source offset ' +
            g.sourceOffset.toFixed(6) + 's, but decoded audio provides ' + Math.max(0, available).toFixed(6) +
            's (audio duration ' + buffer.duration + 's; tolerance ' + TOLERANCE + 's)');
        entry.buffer = buffer;
        return buffer;
      })().catch(error => {
        if (this._cache.get(i) === entry) this._cache.delete(i);
        if (error.name !== 'AbortError' && !this._destroyed && this._allowed.has(i)) {
          if (!error.groupId) error = this._groupError(g, error.message || 'load/decode failed', error);
          this._failures.set(i, error);
        }
        throw error;
      });
      return entry.promise;
    }
    _prefetch(t) {
      const cursor = this._window(t);
      for (const i of [cursor, cursor + 1]) {
        if (!this.groups[i] || !this._allowed.has(i) || this._cache.has(i) || this._failures.has(i)) continue;
        this._load(i).then(() => this._kick(), () => this._kick());
      }
    }
    _rawTime() { return this._baseGlobal + Math.max(0, this._ctx.currentTime - this._baseContext); }
    _clearTimer() { if (this._timer !== null) root.clearTimeout(this._timer); this._timer = null; }
    _later(ms = 30) {
      this._clearTimer();
      if (!this._wantPlaying || this._destroyed) return;
      this._timer = root.setTimeout(() => { this._timer = null; this._pumpSafe(); }, ms);
    }
    _kick() { if (this._wantPlaying && !this._destroyed) this._later(0); }
    _stopSources() {
      for (const record of this._scheduled.values()) if (record.source) {
        record.source.onended = null;
        try { record.source.stop(); } catch (_) {}
        try { record.source.disconnect(); } catch (_) {}
      }
      this._scheduled.clear();
    }
    _freeze(t) {
      this._position = clamp(t, 0, this.duration); this._running = false;
      this._clearTimer(); this._stopSources(); this._energy = 0;
    }
    _scheduleAndLimit() {
      const t = this.currentTime, cursor = this._cursor(t);
      let limit = this.duration;
      for (const [i, record] of this._scheduled) if (this.groups[i].end <= t + EPS) {
        if (record.source) try { record.source.disconnect(); } catch (_) {}
        this._scheduled.delete(i);
      }
      for (let i = cursor; i < this.groups.length; i++) {
        const g = this.groups[i], buffer = this._cache.get(i)?.buffer;
        if (!buffer) { limit = Math.max(t, g.start); break; }
        if (this._scheduled.has(i)) continue;
        const start = Math.max(t, g.start), offset = g.sourceOffset + start - g.start;
        const length = Math.min(g.end - start, Math.max(0, buffer.duration - offset));
        const record = { source: null, ended: length <= EPS };
        this._scheduled.set(i, record);
        if (length <= EPS) continue;
        const source = this._ctx.createBufferSource(); record.source = source;
        source.buffer = buffer; source.connect(this._analyser);
        source.onended = () => {
          try { source.disconnect(); } catch (_) {}
          if (this._scheduled.get(i) === record) { record.source = null; record.ended = true; }
          this._kick();
        };
        source.start(Math.max(this._ctx.currentTime, this._baseContext + start - this._baseGlobal), offset, length);
      }
      this._limit = Math.min(this.duration, limit);
    }
    _beginClock(t) {
      this._stopSources(); this._position = t; this._baseGlobal = t;
      this._baseContext = this._ctx.currentTime + LEAD; this._limit = this.duration; this._running = true;
      this._prefetch(t); this._scheduleAndLimit(); this._emit('playing', true); this._later();
    }
    _resume(token) {
      if (this._resumeTask?.token === token) return this._resumeTask.promise;
      const task = { token, promise: null };
      this._resumeTask = task;
      task.promise = (async () => {
        try {
          await this.unlock();
          if (token !== this._token || !this._wantPlaying || this._destroyed) return;
          const t = this._position; this._window(t);
          const i = this._active(t);
          if (i >= 0) await this._load(i);
          if (token !== this._token || !this._wantPlaying || this._destroyed) return;
          this._beginClock(t);
        } catch (error) {
          if (token !== this._token || this._destroyed) return;
          this._fail(error, token); throw error;
        } finally { if (this._resumeTask === task) this._resumeTask = null; }
      })();
      return task.promise;
    }
    _pumpSafe() {
      try { this._pump(); } catch (error) { this._fail(error, this._token); }
    }
    _pump() {
      if (!this._wantPlaying || this._destroyed) return;
      if (!this._running) { this._resume(this._token).catch(() => {}); return; }
      const raw = this._rawTime();
      if (this.currentTime >= this.duration - EPS) {
        this._freeze(this.duration); this._wantPlaying = false; this._emit('ended', true); return;
      }
      if (raw >= this._limit - EPS && this._limit < this.duration - EPS) {
        this._freeze(this._limit); this._emit('buffering', true);
        this._resume(this._token).catch(() => {}); return;
      }
      const t = this.currentTime;
      this._prefetch(t); this._scheduleAndLimit();
      this._emit(this._ctx.state === 'running' ? 'playing' : 'suspended');
      this._later();
    }
    _snapshot(state = this._state) {
      const t = this.currentTime, i = this._active(t);
      return { state, currentTime: t, time: t, duration: this.duration, paused: this.paused,
        buffering: state === 'buffering' || state === 'loading', groupId: i < 0 ? null : this.groups[i].id,
        energy: this.energy, declaredDuration: this.declaredDuration };
    }
    _emit(state, force = false) {
      const changed = state !== this._state; this._state = state;
      const now = Date.now();
      if (!this._onState || (!force && !changed && now - this._lastNotify < 100)) return;
      this._lastNotify = now;
      try { this._onState(this._snapshot(state)); } catch (_) {}
    }
    _fail(error, token) {
      if (token !== this._token || this._destroyed) return;
      this._freeze(this.currentTime); this._wantPlaying = false; this._emit('error', true);
      try { this._onError?.(error, this._snapshot('error')); } catch (_) {}
    }
    async play() {
      this._assert();
      if (this._wantPlaying && this._running) { await this.unlock(); this._kick(); return; }
      if (this._wantPlaying && this._resumeTask?.token === this._token) return this._resumeTask.promise;
      const token = ++this._token;
      if (this._position >= this.duration - EPS) this._position = 0;
      this._wantPlaying = true; this._failures.clear(); this._window(this._position);
      this._emit('loading', true);
      return this._resume(token);
    }
    pause() {
      if (this._destroyed) return;
      const t = this.currentTime; ++this._token; this._wantPlaying = false;
      this._freeze(t); this._emit('paused', true);
    }
    async seek(value) {
      this._assert();
      const t = Number(value);
      if (!Number.isFinite(t)) throw new TypeError('Narration seek time must be finite');
      const resume = this._wantPlaying, token = ++this._token;
      this._freeze(clamp(t, 0, this.duration)); this._wantPlaying = resume;
      this._failures.clear(); this._window(this._position); this._emit('seeking', true);
      if (resume) return this._resume(token);
      try {
        this._context();
        const i = this._active(this._position);
        if (i >= 0) await this._load(i);
        if (token !== this._token || this._destroyed) return;
        this._prefetch(this._position); this._emit('paused', true);
      } catch (error) {
        if (token !== this._token || this._destroyed) return;
        this._fail(error, token); throw error;
      }
    }
    destroy() {
      if (this._destroyed) return Promise.resolve();
      const t = this.currentTime; ++this._token; this._wantPlaying = false; this._freeze(t);
      this._destroyed = true;
      for (const entry of this._cache.values()) entry.controller.abort();
      this._cache.clear(); this._failures.clear();
      if (this._ctx) this._ctx.onstatechange = null;
      try { this._analyser?.disconnect(); } catch (_) {}
      this._emit('destroyed', true);
      return this._ctx && this._ctx.state !== 'closed' ? this._ctx.close().catch(() => {}) : Promise.resolve();
    }
  }
  root.NarrationAudioTimeline = NarrationAudioTimeline;
})(typeof window !== 'undefined' ? window : globalThis);
