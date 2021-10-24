import anime, { AnimeInstance, AnimeTimelineInstance } from "animejs";

let waveAnime: AnimeInstance;
let waveMaskAnime: AnimeInstance;
let sunTl: AnimeTimelineInstance;

const init = () => {
  waveAnime = anime({
    targets: "#loading-svg .wave",
    d: [
      "M 0 128 Q 40.587 112 64 112 Q 87.413 112 128 128 Q 168.587 144 192 144 Q 215.413 144 256 128",
      "M 0 128 Q 40.587 144 64 144 Q 87.413 144 128 128 Q 168.587 112 192 112 Q 215.413 112 256 128",
    ],
    duration: 2000,
    easing: "easeInOutSine",
    direction: "alternate",
    loop: true,
  });
  waveMaskAnime = anime({
    targets: "#loading-svg .wave-mask",
    d: [
      "M 0 128 Q 40.587 112 64 112 Q 87.413 112 128 128 Q 168.587 144 192 144 Q 215.413 144 256 128 L 256 0 L 0 0 L 0 128",
      "M 0 128 Q 40.587 144 64 144 Q 87.413 144 128 128 Q 168.587 112 192 112 Q 215.413 112 256 128 L 256 0 L 0 0 L 0 128",
    ],
    duration: 2000,
    easing: "easeInOutSine",
    direction: "alternate",
    loop: true,
  });

  sunTl = anime.timeline({
    easing: "easeOutQuad",
    loop: true,
  });
  sunTl.add({
    targets: "#loading-svg .sun",
    cy: [192, 96],
    duration: 3000,
  });
  sunTl.add(
    {
      targets: "#loading-svg .sun",
      cy: [96, 192],
      duration: 1000,
    },
    "+=1000"
  );
};

const stop = () =>
  new Promise((resolve) => {
    waveAnime.pause();
    waveMaskAnime.pause();
    sunTl.pause();
    const loadingElem = document.getElementById(
      "loading-wrapper"
    ) as HTMLElement;
    loadingElem.addEventListener("transitionend", () => resolve(""));
    loadingElem.classList.add("fadeout");
  });

export default {
  init,
  stop,
};
