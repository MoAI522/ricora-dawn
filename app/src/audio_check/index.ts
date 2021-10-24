import loading from "./loading";

const init = async (onApproved: () => void, avoid = false) => {
  const audioCheckElement = document.getElementById(
    "audio-check-screen"
  ) as HTMLDivElement;
  const audioCheckButton = document.getElementById(
    "audio-check-ok"
  ) as HTMLButtonElement;

  await loading.stop();
  audioCheckElement.classList.add("ready");
  await new Promise((resolve) => requestAnimationFrame(() => resolve("")));
  audioCheckElement.classList.add("fadein");

  audioCheckButton.addEventListener("click", () => {
    audioCheckButton.disabled = true;
    document.getElementsByTagName("html")[0].style.overflow = "";
    audioCheckElement.addEventListener("transitionend", () => {
      audioCheckElement.style.display = "none";
    });
    audioCheckElement.classList.add("closing");
    onApproved();
  });
  if (avoid) {
    document.getElementsByTagName("html")[0].style.overflow = "";
    onApproved();
  } else {
    audioCheckElement.classList.remove("loading");
  }
};

export default {
  init,
};
