let ctx: AudioContext;

export const init = () => {
  ctx = new AudioContext();
};

export default { ctx, init };
