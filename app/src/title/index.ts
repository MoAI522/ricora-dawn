import anime, { AnimeTimelineInstance } from "animejs";
import config from "../config";
import scroll_manager from "../scroll_manager";

const imageNumber = 11;
let imageElems: Array<HTMLImageElement>;
let tl: AnimeTimelineInstance;
let animDirection: "normal" | "reverse" = "normal";
let animState: "playing" | "stoped" = "stoped";

const load = async () => {
  imageElems = await Promise.all<HTMLImageElement>(
    [...Array(imageNumber)].map(
      (_, index) =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = `${config.LOGO_IMAGE_PATH}${index}.png`;
        })
    )
  );
};

const init = async () => {
  const logoWrapperElem = document.getElementById("title-logo-wrapper");
  imageElems.forEach((image) => logoWrapperElem?.appendChild(image));

  tl = anime.timeline({
    duration: 1000,
    easing: "easeOutQuart",
    update: (anim) => {
      if (anim.completed) {
        animState = "stoped";
      }
    },
    complete: () => {
      animState = "stoped";
    },
    autoplay: false,
  });
  tl.add({
    targets: imageElems[1],
    translateX: [-20, 0],
    opacity: [0, 1],
  })
    .add(
      {
        targets: imageElems[2],
        translateX: [20, 0],
        translateY: [30, 0],
        opacity: [0, 1],
      },
      "-=900"
    )
    .add(
      {
        targets: imageElems[3],
        translateY: [-50, 0],
        opacity: [0, 1],
      },
      "-=900"
    )
    .add(
      {
        targets: imageElems[4],
        translateX: [50, 0],
        opacity: [0, 1],
      },
      "-=900"
    )
    .add(
      {
        targets: imageElems[5],
        translateY: [50, 0],
        opacity: [0, 1],
      },
      "-=900"
    )
    .add(
      {
        targets: imageElems[6],
        translateX: [-50, 0],
        opacity: [0, 1],
      },
      "-=700"
    )
    .add(
      {
        targets: imageElems[7],
        translateX: [-50, 0],
        opacity: [0, 1],
      },
      "-=700"
    )
    .add(
      {
        targets: imageElems[0],
        translateY: [-100, 0],
        opacity: [0, 1],
        easing: "spring(1,100,10,0)",
      },
      "-=1000"
    )
    .add(
      {
        targets: imageElems[8],
        translateX: [Math.sqrt(Math.cos(Math.PI * 0.13) * 50 * 50), 0],
        translateY: [Math.sqrt(Math.sin(Math.PI * 0.13) * 50 * 50), 0],
        opacity: [0, 1],
      },
      "-=1500"
    )
    .add(
      {
        targets: imageElems[9],
        translateX: [Math.sqrt(Math.cos(Math.PI * 0.4) * 50 * 50), 0],
        translateY: [Math.sqrt(Math.sin(Math.PI * 0.4) * 50 * 50), 0],
        opacity: [0, 1],
      },
      "-=1400"
    )
    .add(
      {
        targets: imageElems[10],
        translateX: [Math.sqrt(Math.cos(Math.PI * 0.49) * 50 * 50), 0],
        translateY: [Math.sqrt(Math.sin(Math.PI * 0.49) * 50 * 50), 0],
        opacity: [0, 1],
      },
      "-=1200"
    );

  const titleElement = document.getElementById("title") as HTMLElement;
  scroll_manager.addListener(
    "enter",
    titleElement,
    () => {
      if (animDirection === "reverse") {
        tl.reverse();
        animDirection = "normal";
      }
      if (animState === "stoped") {
        tl.play();
        animState = "playing";
      }
    },
    20
  );
  scroll_manager.addListener(
    "exit",
    titleElement,
    () => {
      if (animDirection === "normal") {
        tl.reverse();
        animDirection = "reverse";
      }
      if (animState === "stoped") {
        tl.play();
        animState = "playing";
      }
    },
    20
  );
};

const onAudioEnabled = () => {
  const titleElem = document.getElementById("information") as HTMLElement;
  if (
    titleElem.clientHeight + 20 >=
    window.scrollY + document.documentElement.clientHeight / 2
  ) {
    tl.play();
    animState = "playing";
  }
};

export default {
  load,
  init,
  onAudioEnabled,
};
