import {PV_TIME} from '/feature-native-pv-audio-v2.js';

export const QUESTION_PAUSE = Object.freeze({
  narrationTime: 1352,
  start: 1352 + PV_TIME.insertDuration,
  duration: 1,
  title: '社会知识如何成为生产力？',
});

export function insertQuestionPause(manifest) {
  const {narrationTime, duration} = QUESTION_PAUSE;
  const groups = manifest.groups.map(group => group.start < narrationTime ? group : {
    ...group, start: group.start + duration, end: group.end + duration,
  });
  groups.push({
    id: 'question-title-silence', start: narrationTime, end: narrationTime + duration,
    sourceUrl: PV_TIME.silenceUrl, sourceOffset: 0,
  });
  return {...manifest, duration: manifest.duration + duration, groups};
}

export function shiftQuestionMusic(config) {
  const {start, duration} = QUESTION_PAUSE;
  const shift = time => time >= start ? time + duration : time;
  const shiftCue = cue => ({...cue, start: shift(cue.start), end: cue.end > start ? shift(cue.end) : cue.end});
  return {
    ...config, duration: shift(config.duration),
    cues: config.cues.map(shiftCue),
    missing: config.missing?.map(shiftCue),
    endingCredits: config.endingCredits && shiftCue(config.endingCredits),
  };
}
