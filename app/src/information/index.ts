import anime, { AnimeTimelineInstance } from "animejs";
import songdata from "../../assets/json/songdata.json";
import scroll_manager from "../scroll_manager";

let animDirection: "normal" | "reverse" = "normal";
let animState: "playing" | "stoped" = "stoped";
let tl: AnimeTimelineInstance;

const init = () => {
  const jacketElem = document.getElementById("jacket");
  const descriptionElem = document.getElementById("description");
  const trackListElem = document.getElementById("information-track-list");

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
    targets: jacketElem,
    translateX: [-50, 0],
    opacity: [0, 1],
  });

  songdata.forEach((song, index) => {
    const content = document.createElement("li");
    content.textContent = `0${index + 1} ${song.title} / ${song.composer}`;
    trackListElem?.appendChild(content);

    tl.add(
      {
        targets: content,
        translateX: [50, 0],
        opacity: [0, 1],
      },
      `-=900`
    );
  });

  tl.add(
    {
      targets: descriptionElem,
      translateX: [50, 0],
      opacity: [0, 1],
    },
    "-=1500"
  );

  const informationElement = document.getElementById(
    "information"
  ) as HTMLElement;
  scroll_manager.addListener(
    "enter",
    informationElement,
    (direction) => {
      if (direction === "up") return;
      if (animDirection === "reverse") {
        tl.reverse();
        animDirection = "normal";
      }
      if (animState === "stoped") {
        tl.play();
        animState = "playing";
      }
    },
    0
  );
  scroll_manager.addListener(
    "exit",
    informationElement,
    (direction) => {
      if (direction === "down") return;
      if (animDirection === "normal") {
        tl.reverse();
        animDirection = "reverse";
      }
      if (animState === "stoped") {
        tl.play();
        animState = "playing";
      }
    },
    0
  );
};

const onAudioEnabled = () => {
  const informationElem = document.getElementById("information") as HTMLElement;
  if (
    informationElem.offsetTop <
    window.scrollY + document.documentElement.clientHeight / 2
  ) {
    tl.play();
    animState = "playing";
  }
};

export default {
  init,
  onAudioEnabled,
};
