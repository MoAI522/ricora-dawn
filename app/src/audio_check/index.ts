const init = (onApproved: () => void, avoid = false) => {
  const audioCheckElement = document.getElementById(
    "audio-check-screen"
  ) as HTMLDivElement;
  const audioCheckButton = document.getElementById(
    "audio-check-ok"
  ) as HTMLButtonElement;
  if (!avoid)
    document.getElementsByTagName("body")[0].style.overflow = "hidden";
  audioCheckButton.addEventListener("click", () => {
    document.getElementsByTagName("body")[0].style.overflow = "auto";
    audioCheckElement.addEventListener("transitionend", () => {
      audioCheckElement.style.display = "none";
      onApproved();
    });
    audioCheckElement.classList.add("closing");
  });
  if (avoid) {
    audioCheckElement.style.display = "none";
    onApproved();
  }
};

export default {
  init,
};
