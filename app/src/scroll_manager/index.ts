type TEventType = "enter" | "exit";
type TDirection = "up" | "down";
type TListener = {
  eventType: TEventType;
  target: HTMLElement;
  callback: (direction: TDirection) => void;
};

const listeners: Record<string, TListener> = {};
let count = 0;
let previousY: number;

const init = () => {
  previousY = window.scrollY + document.documentElement.clientHeight / 2;
  requestAnimationFrame(eventCheck);
};

const eventCheck = () => {
  const currentY = window.scrollY + document.documentElement.clientHeight / 2;
  Object.values(listeners).forEach((listener) => {
    const topY = listener.target.offsetTop;
    const bottomY =
      listener.target.offsetTop + listener.target.clientHeight / 2 + 20;
    if (listener.eventType === "enter" && topY >= previousY && topY < currentY)
      listener.callback("down");
    else if (
      listener.eventType === "enter" &&
      bottomY >= currentY &&
      bottomY < previousY
    )
      listener.callback("up");
    else if (
      listener.eventType === "exit" &&
      bottomY >= previousY &&
      bottomY < currentY
    )
      listener.callback("down");
    else if (
      listener.eventType === "exit" &&
      topY >= currentY &&
      topY < previousY
    )
      listener.callback("up");
  });
  previousY = currentY;
  requestAnimationFrame(eventCheck);
};

const addListener = (
  eventType: TEventType,
  target: HTMLElement,
  callback: (direction: TDirection) => void
) => {
  if (
    eventType === "enter" &&
    target.offsetTop <= previousY &&
    previousY < target.offsetTop + target.clientHeight / 2 + 20
  )
    callback("down");

  listeners[count] = { eventType, target, callback };
  count++;
  return count - 1;
};

const removeListener = (id: number) => {
  delete listeners[id];
};

export default {
  init,
  addListener,
  removeListener,
};
