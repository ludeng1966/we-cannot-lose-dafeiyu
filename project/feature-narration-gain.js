// Preview dialogue only. Leave the source, clock, analyser and mouth motion intact.
export const NARRATION_GAIN_DB = 1.5;
const gainValue = 10 ** (NARRATION_GAIN_DB / 20);
const knee = .82, ceiling = .86;

// No lookahead or time shift. The curve is linear below the brief peak guard.
export function makeDialoguePeakCurve(size = 8193) {
  const curve = new Float32Array(size);
  for(let i=0;i<size;i++){
    const x = 2*i/(size-1)-1, a = Math.abs(x);
    curve[i] = a<=knee ? x : Math.sign(x)*(knee+(ceiling-knee)*Math.tanh((a-knee)/(ceiling-knee)));
  }
  return curve;
}

export function createPreviewNarrationTimeline(manifest, options) {
  const Native = window.NarrationAudioTimeline;
  return new (class extends Native {
    _context() {
      const ctx = super._context();
      if (!this._previewDialogueGain) {
        const gain = ctx.createGain(), peak = ctx.createWaveShaper();
        gain.gain.value = gainValue;
        peak.curve = makeDialoguePeakCurve();
        this._analyser.disconnect(ctx.destination);
        this._analyser.connect(gain);
        gain.connect(peak);
        peak.connect(ctx.destination);
        this._previewDialogueGain = gain;
        this._previewDialoguePeak = peak;
      }
      return ctx;
    }
    async destroy() {
      await super.destroy();
      this._previewDialogueGain?.disconnect();
      this._previewDialoguePeak?.disconnect();
    }
  })(manifest, options);
}
