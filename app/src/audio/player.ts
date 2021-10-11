import { logger } from ".";
import context from "./context";
import data from "./data";

type TAudioPlayerState = "not_initialized" | "stopped" | "playing";
type TAudioFadeTask = {
  trackNumber: number;
  type: "fade" | "audioEnd";
  timeOutHandler: number;
};
type TSourceAndGain = {
  bufferSource: AudioBufferSourceNode;
  gainNode: GainNode;
};

const fadeTime = 1;
const maxGain = 1.0;

let masterGainNode: GainNode | null = null;

let state: TAudioPlayerState = "not_initialized";
let currentTrackNum = 0;
let currentSourceAndGain: TSourceAndGain | null = null;
let audioFadeTasks: Array<TAudioFadeTask> = [];

let audioEndCallback: (() => void) | null = null;

const init = () => {
  const ctx = context.getContext();
  if (ctx === null) return;
  masterGainNode = ctx.createGain();
  masterGainNode.gain.value = maxGain;
  masterGainNode.connect(ctx.destination);
  state = "stopped";
};

const play = (trackNumber: number) => {
  if (trackNumber < 0 || trackNumber >= data.getAudioBuffers().length) return;
  if (state === "not_initialized") return;
  if (masterGainNode === null) return;
  const ctx = context.getContext();
  const audioBuffer = data.getAudioBuffers()?.[trackNumber];
  if (ctx === null || audioBuffer === null) return;
  logger.debug("play", trackNumber, currentSourceAndGain, audioFadeTasks);

  if (
    audioFadeTasks.some(
      (v) => v.trackNumber == trackNumber && v.type === "fade"
    ) &&
    currentSourceAndGain !== null
  ) {
    logger.debug("cancel task");
    audioFadeTasks
      .filter((v) => v.trackNumber == trackNumber && v.type === "fade")
      .forEach((task) => window.clearTimeout(task.timeOutHandler));
    audioFadeTasks = audioFadeTasks.filter(
      (v) => v.trackNumber != trackNumber || v.type !== "fade"
    );

    currentSourceAndGain.gainNode.gain.value =
      currentSourceAndGain.gainNode.gain.value;
    currentSourceAndGain.gainNode.gain.linearRampToValueAtTime(
      1.0,
      ctx.currentTime + fadeTime
    );
  } else {
    if (state === "playing") {
      fadeOutCurrentTrack();
    }
    const bufferSource = ctx.createBufferSource();
    bufferSource.buffer = audioBuffer;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.01;
    bufferSource.connect(gainNode).connect(masterGainNode);
    bufferSource.start();
    currentSourceAndGain = { bufferSource: bufferSource, gainNode: gainNode };

    const audioEndHandler = window.setTimeout(() => {
      logger.debug("audio end");
      audioFadeTasks = audioFadeTasks.filter(
        (v) => v.trackNumber != trackNumber || v.type !== "audioEnd"
      );
      if (audioEndCallback !== null) audioEndCallback();
    }, (audioBuffer.duration - fadeTime) * 1000);
    audioFadeTasks.push({
      trackNumber: trackNumber,
      type: "audioEnd",
      timeOutHandler: audioEndHandler,
    });
  }

  {
    currentSourceAndGain.gainNode.gain.linearRampToValueAtTime(
      1.0,
      ctx.currentTime + fadeTime
    );
    const fadeInCompleteHandler = window.setTimeout(() => {
      audioFadeTasks = audioFadeTasks.filter(
        (v) => v.trackNumber != trackNumber && v.type !== "fade"
      );
    }, fadeTime);

    audioFadeTasks.push({
      trackNumber: trackNumber,
      type: "fade",
      timeOutHandler: fadeInCompleteHandler,
    });
  }

  currentTrackNum = trackNumber;
  state = "playing";
};

const pause = () => {
  logger.debug("pause");
  if (state !== "playing") return;

  fadeOutCurrentTrack(true);
  state = "stopped";
};

const fadeOutCurrentTrack = (pause: boolean = false) => {
  const ctx = context.getContext();
  if (currentSourceAndGain === null || ctx === null) return;
  logger.debug(
    "fadeOutCurrentTrack",
    ctx.currentTime,
    currentSourceAndGain.gainNode.gain.value
  );
  currentSourceAndGain.gainNode.gain.value =
    currentSourceAndGain.gainNode.gain.value;
  currentSourceAndGain.gainNode.gain.linearRampToValueAtTime(
    0.01,
    ctx.currentTime + fadeTime
  );
  audioFadeTasks = audioFadeTasks.filter(
    (v) => v.trackNumber != currentTrackNum
  );
  const bufferSource = currentSourceAndGain.bufferSource;
  const trackNum = currentTrackNum;
  const timeOutHandler = window.setTimeout(() => {
    bufferSource.stop();
    audioFadeTasks = audioFadeTasks.filter((v) => v.trackNumber != trackNum);
    if (pause) {
      currentSourceAndGain = null;
    }
    logger.debug("audio stopped", currentTrackNum, audioFadeTasks);
  }, fadeTime * 1000);
  audioFadeTasks.push({
    trackNumber: currentTrackNum,
    type: "fade",
    timeOutHandler: timeOutHandler,
  });
};

const setGain = (gain: number) =>
  masterGainNode?.gain.linearRampToValueAtTime(gain, 0.5);

const setAudioEndCallback = (cb: () => void) => (audioEndCallback = cb);

const getState = () => state;

const getCurrentTrackNum = () => currentTrackNum;

export default {
  init,
  play,
  pause,
  setGain,
  setAudioEndCallback,
  getState,
  getCurrentTrackNum,
};
