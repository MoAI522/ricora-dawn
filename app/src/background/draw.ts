import { mat4, vec3 } from "gl-matrix";
import resources from "./resources";
import sea from "./sea";
import skybox from "./skybox";
import textures from "./textures";

let gl: WebGLRenderingContext | null = null;

const init = async (backgroundElement: HTMLDivElement) => {
  const canvasElement = document.createElement("canvas");
  backgroundElement.appendChild(canvasElement);

  const adjustCanvasSize = () => {
    canvasElement.width = backgroundElement.clientWidth;
    canvasElement.height = backgroundElement.clientHeight;
  };
  window.addEventListener("resize", adjustCanvasSize);
  adjustCanvasSize();

  gl = canvasElement.getContext("webgl");

  if (gl === null) {
    return false;
  }

  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  await resources.load();

  textures.init(gl);
  if (!sea.init(gl) || !skybox.init(gl)) {
    return false;
  }

  requestAnimationFrame(drawScene);
  return true;
};

const drawScene = (time: number) => {
  if (gl === null) return;
  time *= 0.001;

  const fieldOfView = (45 * Math.PI) / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 1;
  const zFar = 2000;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const cameraPosition = vec3.create();
  const target = vec3.create();
  const up = vec3.create();
  vec3.set(cameraPosition, 0, 0, 0);
  vec3.set(target, 0, 0, 1);
  // vec3.set(target, Math.sin(time * 0.1), 0, Math.cos(time * 0.1));
  vec3.set(up, 0, 1, 0);
  const cameraMatrix = mat4.create();
  mat4.lookAt(cameraMatrix, cameraPosition, target, up);
  const viewMatrix = mat4.create();
  mat4.invert(viewMatrix, cameraMatrix);

  const worldMatrix = mat4.create();

  const scrollRatio =
    window.scrollY /
    (document.documentElement.scrollHeight -
      document.documentElement.clientHeight);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.CULL_FACE);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  skybox.draw(gl, projectionMatrix, viewMatrix, scrollRatio);
  sea.draw(
    gl,
    projectionMatrix,
    viewMatrix,
    worldMatrix,
    cameraPosition,
    time,
    scrollRatio
  );

  requestAnimationFrame(drawScene);
};

export default {
  init,
};
