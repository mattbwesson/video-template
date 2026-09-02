import React, { useCallback, useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { GRID_B64, GRID_H, GRID_W } from "./gradientMeshGrid";

// Port of public/refs/gradient-mesh.html. The browser version drives the
// shader off requestAnimationFrame; here time comes from the frame number so
// renders are deterministic.
const CONFIG = {
  speed: 0.36, // drift rate of the mesh motion (0 = frozen, exact match)
  distortion: 0.5, // strength of the noise folding
  swirl: 0.3, // rotational twist around center
};

// CSS fallback, matching the reference, used if WebGL is unavailable.
export const MESH_FALLBACK_BACKGROUND =
  "radial-gradient(110% 95% at 85% 95%, rgba(122,62,251,0.95), rgba(100,53,240,0) 70%)," +
  "radial-gradient(70% 60% at 12% 108%, rgba(80,51,232,0.7), rgba(80,51,232,0) 65%)," +
  "linear-gradient(140deg, #020747, #1f1490 55%, #4429d0 80%, #6c38f8)";

const vertSrc = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const fragSrc = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_distortion;
uniform float u_swirl;
uniform sampler2D u_grid;
uniform vec2 u_gridSize;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec2 rotate(vec2 uv, vec2 center, float angle){
  vec2 d = uv - center;
  float s = sin(angle), c = cos(angle);
  return center + vec2(c*d.x - s*d.y, s*d.x + c*d.y);
}

// smooth (quintic-filtered) bilinear sample of the color grid
vec3 sampleGrid(vec2 uv){
  vec2 st = uv * u_gridSize - 0.5;
  vec2 i = floor(st);
  vec2 f = fract(st);
  f = f*f*f*(f*(f*6.0 - 15.0) + 10.0);
  vec2 suv = (i + f + 0.5) / u_gridSize;
  return texture2D(u_grid, suv).rgb;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  float t = u_time;

  // gentle swirl around center (aspect-corrected so it stays circular)
  vec2 auv = vec2(uv.x * aspect, uv.y);
  vec2 center = vec2(0.5 * aspect, 0.5);
  float d = length(auv - center);
  float angle = u_swirl * 0.15 * (1.0 - d) * sin(t * 0.4);
  auv = rotate(auv, center, angle);
  vec2 wuv = vec2(auv.x / aspect, auv.y);

  // gentle noise warp of the lookup coordinates
  float n1 = snoise(auv * 1.6 + vec2(t * 0.25, -t * 0.18));
  float n2 = snoise(auv * 3.1 - vec2(t * 0.12,  t * 0.20));
  wuv += u_distortion * 0.045 * vec2(n1 + 0.35 * n2, n2 - 0.35 * n1);

  wuv = clamp(wuv, 0.0, 1.0);
  vec3 col = sampleGrid(wuv);

  // subtle dither so smooth gradients don't band into 8-bit steps
  float dith = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (dith - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
  }
  return s;
};

type Scene = {
  gl: WebGLRenderingContext;
  uRes: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
};

const setupScene = (canvas: HTMLCanvasElement): Scene | null => {
  const gl = canvas.getContext("webgl", {
    // Remotion screenshots the canvas after React has painted, so the drawing
    // buffer has to survive past the draw call.
    preserveDrawingBuffer: true,
    antialias: false,
  });
  if (!gl) {
    return null;
  }

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // upload the reference color grid as a texture
  const grid = Uint8Array.from(atob(GRID_B64), (c) => c.charCodeAt(0));
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    GRID_W,
    GRID_H,
    0,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    grid
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(prog, "u_grid"), 0);
  gl.uniform2f(gl.getUniformLocation(prog, "u_gridSize"), GRID_W, GRID_H);
  gl.uniform1f(
    gl.getUniformLocation(prog, "u_distortion"),
    CONFIG.distortion
  );
  gl.uniform1f(gl.getUniformLocation(prog, "u_swirl"), CONFIG.swirl);

  return {
    gl,
    uRes: gl.getUniformLocation(prog, "u_res"),
    uTime: gl.getUniformLocation(prog, "u_time"),
  };
};

export interface GradientMeshProps {
  /** Extra seconds added to the shader clock, to offset the motion. */
  timeOffsetInSeconds?: number;
  style?: React.CSSProperties;
}

export const GradientMesh: React.FC<GradientMeshProps> = ({
  timeOffsetInSeconds = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (!sceneRef.current) {
      sceneRef.current = setupScene(canvas);
    }
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }
    const { gl, uRes, uTime } = scene;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(
      uTime,
      (frame / fps + timeOffsetInSeconds) * CONFIG.speed * 5.0
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }, [fps, frame, timeOffsetInSeconds]);

  // Layout effect so the pixels are in place before Remotion captures.
  useLayoutEffect(draw, [draw]);

  return (
    <AbsoluteFill style={{ background: MESH_FALLBACK_BACKGROUND, ...style }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
