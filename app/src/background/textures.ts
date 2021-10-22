import resources from "./resources";

let texture: WebGLTexture | null = null;

const init = (gl: WebGLRenderingContext) => {
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  const hdriImages = resources.getHDRIImages();
  const faceInfos = [
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, image: hdriImages.xp },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, image: hdriImages.xp },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, image: hdriImages.yp },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, image: hdriImages.yp },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, image: hdriImages.zp },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, image: hdriImages.zp },
  ];
  faceInfos.forEach(({ target, image }) => {
    const level = 0;
    const internalFormat = gl.RGBA;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.texImage2D(target, level, internalFormat, format, type, image);
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(
    gl.TEXTURE_CUBE_MAP,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );
};

const getTexture = () => texture;

export default {
  init,
  getTexture,
};
