let ctx: AudioContext | null = null;

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export const init = () => {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
};

export const getContext = () => ctx;

export default { init, getContext };
