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

uniform float uParam;
uniform samplerCube uSkybox;
uniform mat4 uViewDirectionProjectionInverse;
varying vec4 vPosition;

const vec4 phasesFrom = vec4(0.46, 0.50, 0.39, 0.);
const vec4 frequenciesFrom = vec4(0.03, 0.00, 0.06, 0.);
const vec4 phasesTo = vec4(0.35, 0.43, 0.55, 0.);
const vec4 frequenciesTo = vec4(0.06, 0.03, 0.10, 0.);
const vec4 amplitudes = vec4(1.00, 1.00, 1.00, 0.);
const vec4 offsets = vec4(0.00, 0.00, 0.00, 0.);

const float TAU = 2. * 3.14159265;

vec4 cosine_gradient(float x,  vec4 phase, vec4 amp, vec4 freq, vec4 offset){
  phase *= TAU;
  x *= TAU;

  return vec4(
    offset.r + amp.r * 0.5 * cos(x * freq.r + phase.r) + 0.5,
    offset.g + amp.g * 0.5 * cos(x * freq.g + phase.g) + 0.5,
    offset.b + amp.b * 0.5 * cos(x * freq.b + phase.b) + 0.5,
    offset.a + amp.a * 0.5 * cos(x * freq.a + phase.a) + 0.5
  );
}

vec3 toRGB(vec4 grad){
  return grad.rgb;
}

float overrayf(float base, float mix) {
  if (base < 0.5) {
    return base * mix * 2.0;
  } else {
    return 2.0 * (base + mix - base * mix) - 1.0;
  }
}

vec4 overray(vec4 base, vec4 mix) {
  return vec4(overrayf(base.x,mix.x),overrayf(base.y,mix.y),overrayf(base.z,mix.z),base.w);
}

void main(void) {
  vec4 t = uViewDirectionProjectionInverse * vec4(vPosition.x, vPosition.y, vPosition.z, vPosition.w);
  vec4 baseColor = vec4(textureCube(uSkybox, normalize(t.xyz / t.w)).xyz * (smoothstep(0.0,0.5,uParam)* 0.1 + 0.9), 1.0);

  vec2 uv = vPosition.xy;
  vec4 cos_grad = cosine_gradient(uv.y, mix(phasesFrom, phasesTo, uParam), amplitudes, mix(frequenciesFrom, frequenciesTo, uParam), offsets);
  cos_grad = clamp(cos_grad, 0., 1.);
  vec4 color = vec4(toRGB(cos_grad), 1.0);

  gl_FragColor = overray(baseColor, color);
  //gl_FragColor = textureCube(uSkybox, normalize(t.xyz / t.w));
}
`;

const attribLocations = {
  aPosition: 0,
};
const uniformLocations = {
  uParam: null,
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
  viewMatrix: mat4,
  scrollRatio: number
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
  gl.uniform1f(programInfo.uniformLocations.uParam, scrollRatio);

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
