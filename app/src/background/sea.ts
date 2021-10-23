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

//---noise---///
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2, p2),dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m = m * m;
    return 105.0 * dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
//---noise---//

//---gradation---//
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
//---gradation---//

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
  const float scale = 0.1;
  const float pos_scale = 0.2;
  vec2 pos = (vPosition + vec2(1.0)) / 2.0 * 500.0;
  vec2 dtv = vec2(0.0, uTime * 1.3);
  vec2 tx1 = pos * pos_scale + dtv + vec2(-0.5,0.0);
  vec2 tx2 = pos * pos_scale + dtv + vec2(0.5,0.0);
  vec2 ty1 = pos * pos_scale + dtv + vec2(0.0,-0.5);
  vec2 ty2 = pos * pos_scale + dtv + vec2(0.0,0.5);
  float nx1 = snoise(vec3(tx1, uTime * 0.1));
  float nx2 = snoise(vec3(tx2, uTime * 0.1));
  float ny1 = snoise(vec3(ty1, uTime * 0.1));
  float ny2 = snoise(vec3(ty2, uTime * 0.1));
  float dx = (nx2 - nx1) / 2.0 * scale * smoothstep(0.3, 0.5, (1.0 - (vPosition.y + 1.0) / 2.0));
  float dy = (ny2 - ny1) / 2.0 * scale * smoothstep(0.3, 0.5, (1.0 - (vPosition.y + 1.0) / 2.0));
  vec3 dxv = vec3(1,dx,0);
  vec3 dyv = vec3(0,dy,1);
  
  vec3 windedNormal = cross(dyv, dxv);
  vec3 worldNormal = normalize(windedNormal);
  vec3 eyeToSurfaceDir = normalize(vWorldPosition - uWorldCameraPosition);
  vec3 direction = reflect(eyeToSurfaceDir, worldNormal);
  vec4 baseColor = vec4(textureCube(uSkybox, direction).xyz * (smoothstep(0.0,0.5,uParam)* 0.1 + 0.9) * 0.9, 1.0);

  vec2 uv = 1.0 - smoothstep(0.0, 0.1, clamp(vPosition + 0.04, 0.0, 1.0));
  vec4 cos_grad = cosine_gradient(uv.y, mix(sbPhasesFrom, sbPhasesTo, uParam), sbAmplitudes, mix(sbFrequenciesFrom, sbFrequenciesTo, uParam), sbOffsets);
  cos_grad = clamp(cos_grad, 0., 1.);
  vec4 sbOverrayColor = vec4(toRGB(cos_grad), 1.0);

  uv = vPosition;
  cos_grad = cosine_gradient(uv.y, phases, amplitudes, frequencies, offsets);
  cos_grad = clamp(cos_grad, 0., 1.);
  vec4 color = vec4(toRGB(cos_grad), 1.0);

  gl_FragColor = overray(overray(baseColor, sbOverrayColor),color);
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
