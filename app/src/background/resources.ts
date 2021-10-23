import config from "../config";

const pathList = {
  // xp: config.SKYBOX_IMAGE_PATH + "px.png",
  // xn: config.SKYBOX_IMAGE_PATH + "nx.png",
  // yp: config.SKYBOX_IMAGE_PATH + "py.png",
  // yn: config.SKYBOX_IMAGE_PATH + "ny.png",
  zp: config.SKYBOX_IMAGE_PATH + "pz.png",
  // zn: config.SKYBOX_IMAGE_PATH + "nz.png",
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
