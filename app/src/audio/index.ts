import createLogger from "../utilities/logger";
import context from "./context";
import data from "./data";
import player from "./player";

export const logger = createLogger("audio");

type TAudioState = "not_initialized" | "initialized";
let state: TAudioState = "not_initialized";

const init = async () => {
  logger.debug("init", { state });
  if (state === "initialized") return;

  context.init();
  await data.init();
  await player.init();

  state = "initialized";

  document.addEventListener("xfdplay", () => {
    player.pause();
    player.lock();
  });
  document.addEventListener("xfdstop", () => {
    player.unlock();
  });
  logger.debug("init end", { state });
};

export default {
  load: data.load,
  init,
  play: player.play,
  pause: player.pause,
  setGain: player.setGain,
  setAudioEndCallback: player.setAudioEndCallback,
  getState: player.getState,
  getCurrentTrackNum: player.getCurrentTrackNumber,
  getNumberOfTracks: data.getNumberOfTracks,
};
