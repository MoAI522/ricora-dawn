type TAttribLocations = { [key: string]: number };
type TUniformLocations = { [key: string]: WebGLUniformLocation | null };

type TLocations<ALT, ULT> = {
  attribLocations: ALT;
  uniformLocations: ULT;
};

export type TProgramInfo<ALT, ULT> = {
  program: WebGLProgram;
} & TLocations<ALT, ULT>;

const createProgramInfo = <
  ALT extends TAttribLocations,
  ULT extends TUniformLocations
>(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string,
  locations: TLocations<ALT, ULT>
) => {
  const program = initShaderProgram(gl, vsSource, fsSource);
  if (program === null) return null;
  const attribLocations = Object.keys(locations.attribLocations).reduce(
    (acc, key) => {
      acc[key] = gl.getAttribLocation(program, key as string);
      return acc;
    },
    {} as TAttribLocations
  );
  const uniformLocations = Object.keys(locations.uniformLocations).reduce(
    (acc, key) => {
      acc[key] = gl.getUniformLocation(program, key as string);
      return acc;
    },
    {} as TUniformLocations
  );
  const programInfo: TProgramInfo<ALT, ULT> = {
    program: program,
    attribLocations: attribLocations as ALT,
    uniformLocations: uniformLocations as ULT,
  };
  return programInfo;
};

const initShaderProgram = (
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
) => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (vertexShader === null || fragmentShader === null) return null;

  const shaderProgram = gl.createProgram();
  if (shaderProgram === null) return null;
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
};

const loadShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
) => {
  const shader = gl.createShader(type);
  if (shader === null) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

export default createProgramInfo;
