import context from "./context";
import data from "./data";

type TAudioPlayerState = "not_initialized" | "stopped" | "playing";
type TAudioFadeTask = {
  trackNumber: number;
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
  console.log("play", trackNumber, ctx.currentTime);

  let task;
  if (
    (task = audioFadeTasks.filter((v) => v.trackNumber == trackNumber)).length >
    0
  ) {
    window.clearTimeout(task[0].timeOutHandler);
    audioFadeTasks = audioFadeTasks.filter((v) => v.trackNumber != trackNumber);
  }

  const bufferSource = ctx.createBufferSource();
  bufferSource.buffer = audioBuffer;
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.01;
  bufferSource.connect(gainNode).connect(masterGainNode);
  bufferSource.start();

  {
    gainNode.gain.linearRampToValueAtTime(1.0, ctx.currentTime + fadeTime);
    const timeOutHandler = window.setTimeout(() => {
      audioFadeTasks = audioFadeTasks.filter(
        (v) => v.trackNumber != trackNumber
      );
    }, fadeTime);
    audioFadeTasks.push({
      trackNumber: trackNumber,
      timeOutHandler: timeOutHandler,
    });
  }

  if (state === "playing") {
    fadeOutCurrentTrack();
  }

  currentSourceAndGain = { bufferSource: bufferSource, gainNode: gainNode };
  currentTrackNum = trackNumber;
  state = "playing";
};

const pause = () => {
  console.log("pause");
  if (state !== "playing") return;

  fadeOutCurrentTrack();

  currentSourceAndGain = null;
  state = "stopped";
};

const fadeOutCurrentTrack = () => {
  const ctx = context.getContext();
  if (currentSourceAndGain === null || ctx === null) return;
  console.log(
    "fadeOutCurrentTrack",
    ctx.currentTime,
    currentSourceAndGain.gainNode.gain.value
  );
  currentSourceAndGain.gainNode.gain.linearRampToValueAtTime(
    0.01,
    ctx.currentTime + fadeTime
  );
  const bufferSource = currentSourceAndGain.bufferSource;
  const timeOutHandler = window.setTimeout(() => {
    bufferSource.stop();
    audioFadeTasks = audioFadeTasks.filter(
      (v) => v.trackNumber != currentTrackNum
    );
    console.log("audio stopped", currentTrackNum, audioFadeTasks);
  }, fadeTime * 1000);
  audioFadeTasks.push({
    trackNumber: currentTrackNum,
    timeOutHandler: timeOutHandler,
  });
};

const setGain = (gain: number) =>
  masterGainNode?.gain.linearRampToValueAtTime(gain, 0.5);

const getState = () => state;

const getCurrentTrackNum = () => currentTrackNum;

export default {
  init,
  play,
  pause,
  setGain,
  getState,
  getCurrentTrackNum,
};
