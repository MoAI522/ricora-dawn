import { mat4 } from "gl-matrix";
import createProgramInfo, { TProgramInfo } from "./programInfo";

const vsSource = `
attribute vec4 aPosition;
varying vec4 vPosition;

void main(void) {
  vPosition = aPosition;
  gl_Position = aPosition;
  gl_Position.z = 1.0;
  gl_Position.w = 1.0;
}
`;
const fsSource = `
precision mediump float;

uniform samplerCube uSkybox;
uniform mat4 uViewDirectionProjectionInverse;
varying vec4 vPosition;

void main(void) {
  vec4 t = uViewDirectionProjectionInverse * vPosition;
  gl_FragColor = textureCube(uSkybox, normalize(t.xyz / t.w));
}
`;

const attribLocations = {
  aPosition: 0,
};
const uniformLocations = {
  uSkybox: null,
  uViewDirectionProjectionInverse: null,
};

let programInfo: TProgramInfo<
  typeof attribLocations,
  typeof uniformLocations
> | null = null;
let positionBuffer: WebGLBuffer | null = null;

const init = (gl: WebGLRenderingContext) => {
  programInfo = createProgramInfo(gl, vsSource, fsSource, {
    attribLocations,
    uniformLocations,
  });
  if (programInfo === null) return false;

  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return true;
};

const draw = (
  gl: WebGLRenderingContext,
  projectionMatrix: mat4,
  viewMatrix: mat4
) => {
  if (programInfo === null) return;

  const viewDirectionMatrix = mat4.create();
  mat4.copy(viewDirectionMatrix, viewMatrix);
  viewDirectionMatrix[12] = 0;
  viewDirectionMatrix[13] = 0;
  viewDirectionMatrix[14] = 0;
  const viewDirectionProjectionMatrix = mat4.create();
  mat4.multiply(
    viewDirectionProjectionMatrix,
    projectionMatrix,
    viewDirectionMatrix
  );
  mat4.invert(viewDirectionProjectionMatrix, viewDirectionProjectionMatrix);

  gl.depthFunc(gl.LEQUAL);
  gl.useProgram(programInfo.program);

  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
      programInfo.attribLocations.aPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.aPosition);
  }

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.uViewDirectionProjectionInverse,
    false,
    viewDirectionProjectionMatrix
  );
  gl.uniform1i(programInfo.uniformLocations.uSkybox, 0);

  {
    const first = 0;
    const count = 6;
    gl.drawArrays(gl.TRIANGLES, first, count);
  }
};

export default {
  init,
  draw,
};
