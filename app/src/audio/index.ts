import context from "./context";

type TAudioState = "not_initialized" | "initialized";
let state: TAudioState = "not_initialized";

const init = async () => {
  if (state === "initialized") return;

  try {
    context.init();
  } catch (error) {
    return;
  }

  state = "initialized";
};

export default {
  init,
};
