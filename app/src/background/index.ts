import draw from "./draw";

const init = async () => {
  const backgroundElement = document.getElementById(
    "background"
  ) as HTMLDivElement;

  if (!(await draw.init(backgroundElement))) {
    backgroundElement.style.background = "url(images/background.jpg)";
  }
};

export default {
  init,
};
