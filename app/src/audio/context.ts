let ctx: AudioContext | null = null;

export const init = () => {
  ctx = new AudioContext();
};

export const getContext = () => ctx;

export default { init, getContext };
