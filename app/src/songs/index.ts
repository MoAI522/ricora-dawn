import anime, { AnimeTimelineInstance } from "animejs";
import songdata from "../../assets/json/songdata.json";
import audio from "../audio";
import config from "../config";
import scroll_manager from "../scroll_manager";

let songElems: Array<HTMLDivElement>;

const init = () => {
  const songsElem = document.getElementById("songs");

  songElems = songdata.map((song, index) => {
    const songElem = document.createElement("div");
    songElem.classList.add("song");
    songsElem?.appendChild(songElem);

    const wrapperElem = document.createElement("div");
    wrapperElem.classList.add("wrapper");
    songElem.appendChild(wrapperElem);

    const trackNumberElem = document.createElement("div");
    trackNumberElem.classList.add("track-number");
    trackNumberElem.textContent = `0${index + 1}`;
    wrapperElem.appendChild(trackNumberElem);

    const slashElem = document.createElement("div");
    slashElem.classList.add("slash");
    wrapperElem.appendChild(slashElem);

    const songTitleElem = document.createElement("div");
    songTitleElem.classList.add("song-title");
    songTitleElem.textContent = song.title;
    wrapperElem.appendChild(songTitleElem);

    const composerElem = document.createElement("div");
    composerElem.classList.add("composer");
    composerElem.textContent = song.composer;
    wrapperElem.appendChild(composerElem);

    const snsLinkContainerElem = document.createElement("div");
    snsLinkContainerElem.classList.add("sns-link-container");
    wrapperElem.appendChild(snsLinkContainerElem);

    if (song.soundcloud) {
      const soundCloudLinkElem = document.createElement("a");
      soundCloudLinkElem.classList.add("sns-link", "sc");
      soundCloudLinkElem.href = song.soundcloud;
      snsLinkContainerElem.appendChild(soundCloudLinkElem);

      const imageElem = document.createElement("img");
      imageElem.src = config.SNS_LOGO_IMAGE_PATH + "soundcloud.png";
      soundCloudLinkElem.appendChild(imageElem);
    }

    if (song.twitter) {
      const twitterLinkElem = document.createElement("a");
      twitterLinkElem.classList.add("sns-link", "tw");
      twitterLinkElem.href = song.twitter;
      snsLinkContainerElem.appendChild(twitterLinkElem);

      const imageElem = document.createElement("img");
      imageElem.src = config.SNS_LOGO_IMAGE_PATH + "twitter.svg";
      twitterLinkElem.appendChild(imageElem);
    }

    let animDirection: "normal" | "reverse" = "normal";
    let animState: "playing" | "stoped" = "stoped";
    const tl = anime.timeline({
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
    });

    tl.add({
      targets: trackNumberElem,
      opacity: [0, 0.5],
    });
    tl.add(
      {
        targets: slashElem,
        opacity: [0, 1],
        translateY: [-100, 0],
        rotateZ: [-100, 0],
      },
      "-=900"
    );
    tl.add(
      {
        targets: songTitleElem,
        opacity: [0, 1],
        translateX: [-50, 0],
      },
      "-=900"
    );
    tl.add(
      {
        targets: composerElem,
        opacity: [0, 1],
        translateY: [-50, 0],
      },
      "-=900"
    );
    tl.add(
      {
        targets: snsLinkContainerElem,
        opacity: [0, 1],
        translateX: [50, 0],
      },
      "-=900"
    );

    tl.pause();

    scroll_manager.addListener(
      "enter",
      songElem,
      () => {
        if (animDirection === "reverse") {
          tl.reverse();
          animDirection = "normal";
        }
        if (animState === "stoped") {
          tl.play();
          animState = "playing";
        }
        audio.play(index);
      },
      songElem.clientHeight * 0.2
    );
    scroll_manager.addListener(
      "exit",
      songElem,
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
      songElem.clientHeight * 0.2
    );

    return songElem;
  });
};

const onAudioEnabled = () => {
  audio.setAudioEndCallback(() => {
    const trackNumber = audio.getCurrentTrackNum();
    let scrollTo = 0;
    if (trackNumber == audio.getNumberOfTracks() - 1) {
      audio.pause();
      const informationElem = document.getElementById(
        "information"
      ) as HTMLDivElement;
      scrollTo = Math.min(
        informationElem.offsetTop,
        document.documentElement.scrollHeight -
          document.documentElement.clientHeight
      );
    } else {
      audio.play(trackNumber + 1);
      scrollTo = songElems[trackNumber + 1].offsetTop - 50;
    }

    const duration = 2000;
    const arrivalTime = performance.now() + duration;
    let t0 = 0;
    let prevX = window.scrollY;
    let v = 0;
    const omega0 = 5;
    const scrollLoop = (time: number) => {
      if (time > arrivalTime) return;
      const t = (time + duration - arrivalTime) / 1000;
      const dt = t - t0;
      const x0 = prevX - scrollTo;
      const sigma = v != 0 ? v / (x0 * omega0) : 0;
      const x =
        scrollTo +
        x0 * Math.exp(-omega0 * dt) * ((sigma + 1) * dt * omega0 + 1);
      window.scrollTo({ top: x });

      t0 = t;
      prevX = x;
      v =
        x0 *
        omega0 *
        Math.exp(-omega0 * dt) *
        ((sigma + 1) * (1 - omega0 * dt) - 1);

      requestAnimationFrame(scrollLoop);
    };
    requestAnimationFrame(scrollLoop);
  });

  const scrollY = window.scrollY + document.documentElement.clientHeight / 2;
  if (scrollY <= songElems[0].offsetTop) {
    audio.play(0);
    return;
  } else if (songElems[songElems.length - 1].offsetTop < scrollY) {
    audio.play(songElems.length - 1);
    return;
  }

  for (let i = songElems.length - 1; i >= 0; i--) {
    if (songElems[i].offsetTop < scrollY) {
      audio.play(i);
      break;
    }
  }
};

export default {
  init,
  onAudioEnabled,
};
