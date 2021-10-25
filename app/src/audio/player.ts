import { logger } from ".";
import context from "./context";
import data from "./data";

type TAudioPlayerState = "not_initialized" | "stopped" | "playing";
type TAudioTaskType = "fade" | "audioEnd";
type TAudioTask = {
  type: TAudioTaskType;
  timeOutHandler: number;
  control: TAudioControl;
};
type TAudioControl = {
  trackNumber: number;
  bufferSource: AudioBufferSourceNode;
  gainNode: GainNode;
};

const fadeTime = 1;
const maxGain = 1.0;

let masterGainNode: GainNode | null = null;

let state: TAudioPlayerState = "not_initialized";
let currentTrackNumber = 0;
let currentControl: TAudioControl | null = null;
let audioTasks: Array<TAudioTask> = [];
let locked = false;

let audioEndCallback: (() => void) | null = null;

const init = () => {
  const ctx = context.getContext();
  if (ctx === null) return;
  masterGainNode = ctx.createGain();
  masterGainNode.gain.value = maxGain;
  masterGainNode.connect(ctx.destination);
  state = "stopped";

  const silence = ctx.createBufferSource();
  silence.connect(ctx.destination);
  silence.buffer = ctx.createBuffer(1, 1, 22050);
  return new Promise((resolve) => {
    silence.onended = () => {
      silence.disconnect(0);
      resolve("");
    };
    silence.start(0);
  });
};

const play = (trackNumber: number) => {
  if (locked) return;
  if (trackNumber < 0 || trackNumber >= data.getAudioBuffers().length) return;
  if (state === "playing" && trackNumber == currentControl?.trackNumber) return;
  if (state === "not_initialized") return;
  if (masterGainNode === null) return;
  const ctx = context.getContext();
  const audioBuffer = data.getAudioBuffers()?.[trackNumber];
  if (ctx === null || audioBuffer === null) return;
  logger.debug("play", trackNumber, currentControl?.trackNumber, [
    ...audioTasks,
  ]);

  if (currentControl !== null) {
    fade(currentControl, true, true);
  }

  if (
    audioTasks.some((v) => {
      logger.debug("some", v.control.trackNumber, trackNumber, v.type);
      return v.control.trackNumber == trackNumber && v.type === "fade";
    })
  ) {
    const targetTasks = audioTasks.filter(
      (v) => v.control.trackNumber == trackNumber && v.type === "fade"
    );
    logger.debug(
      "this track already been playing. continue",
      trackNumber,
      targetTasks
    );
    fade(targetTasks[0].control, false);
    currentControl = targetTasks[0].control;
    return;
  }

  const bufferSource = ctx.createBufferSource();
  bufferSource.buffer = audioBuffer;
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.01;
  bufferSource.connect(gainNode).connect(masterGainNode);
  bufferSource.start();
  currentControl = {
    bufferSource: bufferSource,
    gainNode: gainNode,
    trackNumber: trackNumber,
  };
  currentTrackNumber = trackNumber;

  fade(currentControl, false);

  const audioEndHandler = window.setTimeout(() => {
    logger.debug("audio end", ctx.currentTime);
    filterTasks(trackNumber, "audioEnd");
    if (audioEndCallback !== null) audioEndCallback();
  }, (audioBuffer.duration - fadeTime) * 1000);
  audioTasks.push({
    type: "audioEnd",
    timeOutHandler: audioEndHandler,
    control: currentControl,
  });
  logger.debug("audio end reserved", ctx.currentTime, [...audioTasks]);

  state = "playing";
};

const pause = () => {
  if (state !== "playing") return;
  if (currentControl === null) return;
  logger.debug("pause");

  fade(currentControl, true, true);
  currentControl = null;
  state = "stopped";
};

const lock = () => (locked = true);
const unlock = () => (locked = false);

const fade = (
  control: TAudioControl,
  isFadeout: boolean,
  pause: boolean = false
) => {
  const ctx = context.getContext();
  if (ctx === null) return;
  logger.debug("fade", control, isFadeout, pause);

  if (
    audioTasks.some(
      (v) => v.control.trackNumber == control.trackNumber && v.type === "fade"
    )
  ) {
    filterTasks(control.trackNumber, "fade");
  }

  control.gainNode.gain.value = control.gainNode.gain.value;
  control.gainNode.gain.linearRampToValueAtTime(
    isFadeout ? 0.01 : 1,
    ctx.currentTime + fadeTime
  );
  const timeOutHandler = window.setTimeout(() => {
    logger.debug("fade task execute", control, isFadeout, pause);
    filterTasks(control.trackNumber, "fade");
    if (isFadeout) control.bufferSource.stop();
    if (pause) filterTasks(control.trackNumber, "audioEnd");
  }, fadeTime * 1000);
  audioTasks.push({
    type: "fade",
    timeOutHandler: timeOutHandler,
    control: control,
  });
  logger.debug("fade task reserved", [...audioTasks]);
};

const filterTasks = (trackNumber: number, type: TAudioTaskType) => {
  const targetTasks = audioTasks.filter(
    (v) => v.control.trackNumber == trackNumber && v.type === type
  );
  targetTasks.forEach((task) => window.clearTimeout(task.timeOutHandler));
  audioTasks = audioTasks.filter(
    (v) => v.control.trackNumber != trackNumber || v.type !== type
  );
  logger.debug("filtered tasks", { trackNumber, type }, targetTasks, [
    ...audioTasks,
  ]);
};

const setGain = (gain: number) => {
  masterGainNode?.gain.linearRampToValueAtTime(gain, 0.5);
};

const setAudioEndCallback = (cb: () => void) => (audioEndCallback = cb);

const getState = () => state;

const getCurrentTrackNumber = () => currentTrackNumber;

export default {
  init,
  play,
  pause,
  setGain,
  setAudioEndCallback,
  getState,
  getCurrentTrackNumber,
  lock,
  unlock,
};
