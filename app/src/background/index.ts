import draw from "./draw";

const startColors: Array<Array<number>> = [
  [51, 37, 71],
  [15, 16, 64],
];
const endColors: Array<Array<number>> = [
  [99, 49, 120],
  [194, 105, 70],
];

const lerpTwoColors = (r: number) => {
  r = Math.min(1, Math.max(0, r));

  return [
    [startColors[0], endColors[0]],
    [startColors[1], endColors[1]],
  ].map(([a, b]) =>
    [
      [a[0], b[0]],
      [a[1], b[1]],
      [a[2], b[2]],
    ].map(([s, t]) => s * (1 - r) + t * r)
  );
};

const colorToString = (colors: Array<number>) =>
  "rgb(" +
  colors.reduce((acc, v) => acc + Math.floor(v) + ",", "").slice(0, -1) +
  ")";

const setColor = (elem: HTMLDivElement, r: number) => {
  const colors = lerpTwoColors(r);
  elem.style.background = `url(images/texture.png), linear-gradient(${colorToString(
    colors[0]
  )}, ${colorToString(colors[1])})`;
};

const init = () => {
  const backgroundElement = document.getElementById(
    "background"
  ) as HTMLDivElement;

  draw.init(backgroundElement);

  let lastKnownScrollPosition = window.scrollY;
  {
    const scrollRatio =
      lastKnownScrollPosition /
      (document.documentElement.scrollHeight -
        document.documentElement.clientHeight);
    setColor(backgroundElement, scrollRatio);
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    lastKnownScrollPosition = window.scrollY;

    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollRatio =
          lastKnownScrollPosition /
          (document.documentElement.scrollHeight -
            document.documentElement.clientHeight);
        setColor(backgroundElement, scrollRatio);
        ticking = false;
      });
      ticking = true;
    }
  });
};

export default {
  init,
};
