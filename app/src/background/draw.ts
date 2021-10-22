import { mat4, vec3 } from "gl-matrix";
import resources from "./resources";
import sea from "./sea";
import skybox from "./skybox";
import textures from "./textures";

const pointerSense = 0.03;

let gl: WebGLRenderingContext | null = null;
let previousPointerVec = { x: 0, y: 0 };
let pointerVelocityVec = { x: 0, y: 0 };
let pointerTargetVec = { x: 0, y: 0 };
let previousTime = 0;

const init = async (backgroundElement: HTMLDivElement) => {
  const canvasElement = document.createElement("canvas");
  backgroundElement.appendChild(canvasElement);

  const adjustCanvasSize = () => {
    canvasElement.width = backgroundElement.clientWidth;
    canvasElement.height = backgroundElement.clientHeight;
  };
  window.addEventListener("resize", adjustCanvasSize);
  adjustCanvasSize();

  window.addEventListener("mousemove", (e) => {
    const rx = e.clientX - document.documentElement.clientWidth / 2;
    const ry = e.clientY - document.documentElement.clientHeight / 2;
    const x = rx / (document.documentElement.clientWidth / 2);
    const y = ry / (document.documentElement.clientHeight / 2);
    if (x < -1 || x > 1 || y < -1 || y > 1) return;
    pointerTargetVec = { x, y };
  });

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
  const dt = time - previousTime;
  previousTime = time;

  const pointerVec = calcPointer(dt);

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
  vec3.set(
    target,
    pointerVec.x * pointerSense,
    -pointerVec.y * pointerSense,
    1
  );
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

const calcPointer = (dt: number) => {
  if (
    previousPointerVec.x == pointerTargetVec.x ||
    previousPointerVec.y == pointerTargetVec.y
  ) {
    return previousPointerVec;
  }
  const omega0 = 5;
  const sigma = {
    x:
      pointerVelocityVec.x != 0
        ? pointerVelocityVec.x /
          ((previousPointerVec.x - pointerTargetVec.x) * omega0)
        : 0,
    y:
      pointerVelocityVec.y != 0
        ? pointerVelocityVec.y /
          ((previousPointerVec.y - pointerTargetVec.y) * omega0)
        : 0,
  };
  const currentPointerVec = {
    x:
      pointerTargetVec.x +
      (previousPointerVec.x - pointerTargetVec.x) *
        Math.exp(-omega0 * dt) *
        ((sigma.x + 1) * omega0 * dt + 1),
    y:
      pointerTargetVec.y +
      (previousPointerVec.y - pointerTargetVec.y) *
        Math.exp(-omega0 * dt) *
        ((sigma.y + 1) * omega0 * dt + 1),
  };
  pointerVelocityVec = {
    x:
      (previousPointerVec.x - pointerTargetVec.x) *
      omega0 *
      Math.exp(-omega0 * dt) *
      ((sigma.x + 1) * (1 - omega0 * dt) - 1),
    y:
      (previousPointerVec.y - pointerTargetVec.y) *
      omega0 *
      Math.exp(-omega0 * dt) *
      ((sigma.y + 1) * (1 - omega0 * dt) - 1),
  };
  previousPointerVec = currentPointerVec;
  return currentPointerVec;
};

export default {
  init,
};
