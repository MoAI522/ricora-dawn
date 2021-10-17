const pathList = {
  xp: "./images/px.png",
  xn: "./images/nx.png",
  yp: "./images/py.png",
  yn: "./images/ny.png",
  zp: "./images/pz.png",
  zn: "./images/nz.png",
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
