import createLogger from "../utilities/logger";
import context from "./context";
import data from "./data";
import player from "./player";

export const logger = createLogger("audio");

type TAudioState = "not_initialized" | "initialized";
let state: TAudioState = "not_initialized";

const init = async () => {
  if (state === "initialized") return;

  context.init();
  await data.init();
  player.init();

  state = "initialized";
};

export default {
  load: data.load,
  init,
  play: player.play,
  pause: player.pause,
  setGain: player.setGain,
  getState: player.getState,
  getCurrentTrackNum: player.getCurrentTrackNum,
};
