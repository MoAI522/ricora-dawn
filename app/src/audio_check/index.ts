const init = (onApproved: () => void, avoid = false) => {
  const audioCheckElement = document.getElementById(
    "audio-check-screen"
  ) as HTMLDivElement;
  const audioCheckButton = document.getElementById(
    "audio-check-ok"
  ) as HTMLButtonElement;
  audioCheckButton.addEventListener("click", () => {
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
    audioCheckElement.style.display = "flex";
  }
};

export default {
  init,
};
