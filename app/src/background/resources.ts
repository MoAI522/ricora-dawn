const pathList = {
  xp: "./images/xp.jpeg",
  xn: "./images/xn.jpeg",
  yp: "./images/yp.jpeg",
  yn: "./images/yn.jpeg",
  zp: "./images/zp.jpeg",
  zn: "./images/zn.jpeg",
};

type THDRIImages = Record<keyof typeof pathList, HTMLImageElement>;
let hdriImages: THDRIImages = {} as THDRIImages;

const load = () => {
  return Promise.all(
    Object.entries(pathList).map(
      ([key, path]) =>
        new Promise((resolve) => {
          const image = new Image();
          image.addEventListener("load", () => {
            hdriImages[key as keyof typeof pathList] = image;
            resolve("");
          });
          image.src = path;
        })
    )
  );
};

const getHDRIImages = () => hdriImages;

export default {
  load,
  getHDRIImages,
};
