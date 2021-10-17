import { mat4, vec3 } from "gl-matrix";
import createProgramInfo, { TProgramInfo } from "./programInfo";

const vsSource = `
attribute vec3 aVertexPosition;
attribute vec3 aNormal;

uniform mat4 uTransformMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uWorld;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vPosition;

void main(void) {
  vec4 position = vec4(aVertexPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * uWorld * uTransformMatrix * position;
  vWorldPosition = (uWorld * uTransformMatrix * position).xyz;
  vWorldNormal = mat3(uWorld) * aNormal;
  vPosition = aVertexPosition.xz;
}
`;
const fsSource = `
precision highp float;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vPosition;

uniform samplerCube uSkybox;

uniform float uTime;
uniform float uParam;
uniform vec3 uWorldCameraPosition;

const int   oct  = 8;
const float per  = 0.5;
const float PI   = 3.1415926;
const float cCorners = 1.0 / 16.0;
const float cSides   = 1.0 / 8.0;
const float cCenter  = 1.0 / 4.0;

const vec4 phases = vec4(0.62, 0.37, 0.33, 0.);
const vec4 amplitudes = vec4(1.00, 1.00, 1.00, 0.);
const vec4 frequencies = vec4(0.01, 0.10, 0.08, 0.);
const vec4 offsets = vec4(0.00, 0.00, 0.00, 0.);

const vec4 sbPhasesFrom = vec4(0.46, 0.50, 0.39, 0.);
const vec4 sbFrequenciesFrom = vec4(0.03, 0.00, 0.06, 0.);
const vec4 sbPhasesTo = vec4(0.35, 0.43, 0.55, 0.);
const vec4 sbFrequenciesTo = vec4(0.06, 0.03, 0.10, 0.);
const vec4 sbAmplitudes = vec4(1.00, 1.00, 1.00, 0.);
const vec4 sbOffsets = vec4(0.00, 0.00, 0.00, 0.);

const float TAU = 2. * 3.14159265;

// 補間関数
float interpolate(float a, float b, float x){
  float f = (1.0 - cos(x * PI)) * 0.5;
  return a * (1.0 - f) + b * f;
}

// 乱数生成
float rnd(vec2 p){
  return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
}

// 補間乱数
float irnd(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec4 v = vec4(rnd(vec2(i.x,       i.y      )),
    rnd(vec2(i.x + 1.0, i.y      )),
    rnd(vec2(i.x,       i.y + 1.0)),
    rnd(vec2(i.x + 1.0, i.y + 1.0)));
  return interpolate(interpolate(v.x, v.y, f.x), interpolate(v.z, v.w, f.x), f.y);
}

// ノイズ生成
float noise(vec2 p){
  float t = 0.0;
  for(int i = 0; i < oct; i++){
    float freq = pow(2.0, float(i));
    float amp  = pow(per, float(oct - i));
    t += irnd(vec2(p.x / freq, p.y / freq)) * amp;
  }
  return t;
}

// シームレスノイズ生成
float snoise(vec2 p, vec2 q, vec2 r){
  return noise(vec2(p.x,       p.y      )) *        q.x  *        q.y  +
    noise(vec2(p.x,       p.y + r.y)) *        q.x  * (1.0 - q.y) +
    noise(vec2(p.x + r.x, p.y      )) * (1.0 - q.x) *        q.y  +
    noise(vec2(p.x + r.x, p.y + r.y)) * (1.0 - q.x) * (1.0 - q.y);
}

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
  const float map = 256.0;
  const float scale = 5.0;
  vec2 pos = (vPosition + vec2(1.0)) / 2.0 * 500.0;
  vec2 dtv = vec2(0.0, uTime * 10.0);
  vec2 tx1 = mod(pos + dtv + vec2(-0.5,0.0), map);
  vec2 tx2 = mod(pos + dtv + vec2(0.5,0.0), map);
  vec2 ty1 = mod(pos + dtv + vec2(0.0,-0.5), map);
  vec2 ty2 = mod(pos + dtv + vec2(0.0,0.5), map);
  float nx1 = snoise(tx1, tx1 / map, vec2(map));
  float nx2 = snoise(tx2, tx2 / map, vec2(map));
  float ny1 = snoise(ty1, ty1 / map, vec2(map));
  float ny2 = snoise(ty2, ty2 / map, vec2(map));
  float dx = (nx2 - nx1) / 2.0 * scale * smoothstep(0.3, 0.5, (1.0 - (vPosition.y + 1.0) / 2.0));
  float dy = (ny2 - ny1) / 2.0 * scale * smoothstep(0.3, 0.5, (1.0 - (vPosition.y + 1.0) / 2.0));
  vec3 dxv = vec3(1,dx,0);
  vec3 dyv = vec3(0,dy,1);
  
  vec3 windedNormal = cross(dyv, dxv);
  vec3 worldNormal = normalize(windedNormal);
  vec3 eyeToSurfaceDir = normalize(vWorldPosition - uWorldCameraPosition);
  vec3 direction = reflect(eyeToSurfaceDir, worldNormal);
  vec4 baseColor = vec4(textureCube(uSkybox, direction).xyz * (smoothstep(0.0,0.5,uParam)* 0.1 + 0.9), 1.0);

  vec2 uv = 1.0 - smoothstep(0.0, 0.1, clamp(vPosition + 0.04, 0.0, 1.0));
  vec4 cos_grad = cosine_gradient(uv.y, mix(sbPhasesFrom, sbPhasesTo, uParam), sbAmplitudes, mix(sbFrequenciesFrom, sbFrequenciesTo, uParam), sbOffsets);
  cos_grad = clamp(cos_grad, 0., 1.);
  vec4 sbOverrayColor = vec4(toRGB(cos_grad), 1.0);

  uv = vPosition;
  cos_grad = cosine_gradient(uv.y, phases, amplitudes, frequencies, offsets);
  cos_grad = clamp(cos_grad, 0., 1.);
  vec4 color = vec4(toRGB(cos_grad), 1.0);

  gl_FragColor = overray(overray(baseColor, sbOverrayColor),color);
  //gl_FragColor = vec4(uv.y,uv.y,uv.y,1.0);
}
`;

const attribLocations = {
  aVertexPosition: 0,
  aNormal: 0,
};
const uniformLocations = {
  uTransformMatrix: null,
  uProjectionMatrix: null,
  uViewMatrix: null,
  uWorld: null,
  uTexture: null,
  uWorldCameraPosition: null,
  uTime: null,
  uParam: null,
};

let programInfo: TProgramInfo<
  typeof attribLocations,
  typeof uniformLocations
> | null = null;
let positionBuffer: WebGLBuffer | null = null;
let normalBuffer: WebGLBuffer | null = null;
let indexBuffer: WebGLBuffer | null = null;

const init = (gl: WebGLRenderingContext) => {
  programInfo = createProgramInfo(gl, vsSource, fsSource, {
    attribLocations,
    uniformLocations,
  });
  if (programInfo === null) return false;

  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const vertices = [
    [-1, 0, 1],
    [1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
  ];
  const positions = vertices.reduce(
    (acc, vertice) => acc.concat([vertice[0], vertice[1], vertice[2]]),
    []
  );
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  const normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  const indices = [0, 1, 2, 0, 2, 3];
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return true;
};

const draw = (
  gl: WebGLRenderingContext,
  projectionMatrix: mat4,
  viewMatrix: mat4,
  worldMatrix: mat4,
  cameraPosition: vec3,
  time: number,
  scrollRatio: number
) => {
  if (programInfo === null) return;

  gl.depthFunc(gl.LESS);
  gl.useProgram(programInfo.program);

  const transformMatrix = mat4.create();
  const translateVec = vec3.create();
  vec3.set(translateVec, 0.0, -1.0, 10.0);
  mat4.translate(transformMatrix, transformMatrix, translateVec);
  const scaleVec = vec3.create();
  vec3.set(scaleVec, 100, 1, 200);
  mat4.scale(transformMatrix, transformMatrix, scaleVec);

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
      programInfo.attribLocations.aVertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.aVertexPosition);
  }

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(
      programInfo.attribLocations.aNormal,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.aNormal);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.uTransformMatrix,
    false,
    transformMatrix
  );
  gl.uniformMatrix4fv(programInfo.uniformLocations.uWorld, false, worldMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.uProjectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.uViewMatrix,
    false,
    viewMatrix
  );
  gl.uniform3fv(
    programInfo.uniformLocations.uWorldCameraPosition,
    cameraPosition
  );
  gl.uniform1i(programInfo.uniformLocations.uTexture, 0);
  gl.uniform1f(programInfo.uniformLocations.uTime, time);
  gl.uniform1f(programInfo.uniformLocations.uParam, scrollRatio);

  {
    const vertexCount = 6;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
};

export default {
  init,
  draw,
};
