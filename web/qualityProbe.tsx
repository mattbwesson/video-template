import { createRoot } from "react-dom/client";
import React from "react";
import { loadRenderer } from "./browserRender";

/**
 * What the encoder settings are worth, measured — dev harness, nothing ships through it.
 *
 * Encodes a short window of the real composition at a given setting, keeps the frame the
 * renderer DREW (via `onFrame`, before it reaches the encoder), decodes the same frame
 * back out of the finished MP4, and compares them. So the number is the encoder's error
 * alone: the drawing is identical on both sides by construction.
 */

const FPS = 25;
const WIDTH = 1920;
const HEIGHT = 1080;

const luma = (d: Uint8ClampedArray): Float32Array => {
  const out = new Float32Array(d.length / 4);
  for (let i = 0; i < out.length; i++) {
    out[i] = 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2];
  }
  return out;
};

const psnr = (a: Float32Array, b: Float32Array): number => {
  let se = 0;
  for (let i = 0; i < a.length; i++) se += (a[i] - b[i]) ** 2;
  return 10 * Math.log10(255 ** 2 / (se / a.length));
};

/** 8x8-window SSIM on luma, averaged. */
const ssim = (a: Float32Array, b: Float32Array, w: number, h: number): number => {
  const C1 = (0.01 * 255) ** 2;
  const C2 = (0.03 * 255) ** 2;
  const win = 8;
  let total = 0;
  let count = 0;
  for (let y = 0; y + win <= h; y += win) {
    for (let x = 0; x + win <= w; x += win) {
      let ma = 0, mb = 0;
      for (let j = 0; j < win; j++)
        for (let i = 0; i < win; i++) {
          ma += a[(y + j) * w + x + i];
          mb += b[(y + j) * w + x + i];
        }
      const n = win * win;
      ma /= n;
      mb /= n;
      let va = 0, vb = 0, cov = 0;
      for (let j = 0; j < win; j++)
        for (let i = 0; i < win; i++) {
          const da = a[(y + j) * w + x + i] - ma;
          const db = b[(y + j) * w + x + i] - mb;
          va += da * da;
          vb += db * db;
          cov += da * db;
        }
      va /= n - 1;
      vb /= n - 1;
      cov /= n - 1;
      total +=
        ((2 * ma * mb + C1) * (2 * cov + C2)) /
        ((ma * ma + mb * mb + C1) * (va + vb + C2));
      count++;
    }
  }
  return total / count;
};

const pixels = (source: CanvasImageSource): Float32Array => {
  const c = new OffscreenCanvas(WIDTH, HEIGHT);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, WIDTH, HEIGHT);
  return luma(ctx.getImageData(0, 0, WIDTH, HEIGHT).data);
};

type Config = {
  label: string;
  videoBitrate?: "medium" | "high" | "very-high" | number;
  hardwareAcceleration?: "no-preference" | "prefer-hardware" | "prefer-software";
  keyframeIntervalInSeconds?: number;
};

const run = async (config: Config, from: number, to: number, at: number) => {
  const { renderMediaOnWeb } = await loadRenderer();
  const { CustomizedWorkvivo } = await import("../src/CustomizedWorkvivo");

  const index = at - from;
  let drawn: Float32Array | null = null;

  const started = performance.now();
  const result = await renderMediaOnWeb({
    composition: {
      id: "CustomizedWorkvivo",
      component: CustomizedWorkvivo,
      durationInFrames: to + 1,
      fps: FPS,
      width: WIDTH,
      height: HEIGHT,
    },
    inputProps: {},
    container: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    outputTarget: "web-fs",
    mediaCacheSizeInBytes: 512 * 1024 * 1024,
    frameRange: [from, to],
    delayRenderTimeoutInMilliseconds: 180_000,
    videoBitrate: config.videoBitrate ?? "medium",
    hardwareAcceleration: config.hardwareAcceleration ?? "no-preference",
    keyframeIntervalInSeconds: config.keyframeIntervalInSeconds ?? 5,
    onProgress: (p) =>
      sessionStorage.setItem(
        "qpprog",
        `${config.label}: ${p.renderedFrames} rendered / ${p.encodedFrames} encoded, hidden=${document.hidden}`,
      ),
    onFrame: (frame) => {
      // The frame as DRAWN, before the encoder sees it.
      if (Math.round((frame.timestamp / 1e6) * FPS) === index) drawn = pixels(frame);
      return frame;
    },
  });

  const blob = await result.getBlob();
  const ms = performance.now() - started;

  const { Input, BlobSource, ALL_FORMATS, CanvasSink } = await import("mediabunny");
  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
  const track = await input.getPrimaryVideoTrack();
  // No width/height: the clip is already 1920x1080 and mediabunny wants a `fit` the
  // moment both are given.
  const sink = new CanvasSink(track!);
  const decoded = await sink.getCanvas(index / FPS);
  const back = pixels(decoded!.canvas as CanvasImageSource);

  return {
    label: config.label,
    seconds: +(ms / 1000).toFixed(1),
    megabytes: +(blob.size / 1e6).toFixed(2),
    mbpsAt212s: +(((blob.size * 8) / ((to - from + 1) / FPS)) / 1e6).toFixed(2),
    psnr: +psnr(drawn!, back).toFixed(2),
    ssim: +ssim(drawn!, back, WIDTH, HEIGHT).toFixed(5),
  };
};

/** The SHIPPED options exactly, over a short range: does the export path itself stall? */
const plain = async (from: number, to: number) => {
  const { renderMediaOnWeb } = await loadRenderer();
  const { CustomizedWorkvivo } = await import("../src/CustomizedWorkvivo");
  const started = performance.now();
  const result = await renderMediaOnWeb({
    composition: {
      id: "CustomizedWorkvivo",
      component: CustomizedWorkvivo,
      durationInFrames: to + 1,
      fps: FPS,
      width: WIDTH,
      height: HEIGHT,
    },
    inputProps: {},
    container: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    outputTarget: "web-fs",
    mediaCacheSizeInBytes: 512 * 1024 * 1024,
    frameRange: [from, to],
    onProgress: (p) =>
      sessionStorage.setItem(
        "qpprog",
        `plain: ${p.renderedFrames}/${p.encodedFrames} hidden=${document.hidden}`,
      ),
  });
  const blob = await result.getBlob();
  return { seconds: +((performance.now() - started) / 1000).toFixed(1), bytes: blob.size };
};

(window as unknown as { __qp: unknown }).__qp = { run, plain };

/**
 * `?auto=1` runs the sweep and posts each row back to the probe server.
 *
 * Because the render CANNOT run in a backgrounded tab: Remotion's `<Img>` clears its
 * `delayRender` on `img.decode()`, and Chrome never resolves that promise while the
 * document is hidden — measured here, `onload` in 9ms and `decode()` still pending after
 * 8s. So this has to run in a window somebody can see, which means it cannot be driven
 * from a console; it drives itself and reports back.
 */
const SWEEP: Config[] = [
  { label: "medium (was: library default)", videoBitrate: "medium" },
  { label: "high", videoBitrate: "high" },
  { label: "very-high (now)", videoBitrate: "very-high" },
  { label: "very-high + 2s keyframes", videoBitrate: "very-high", keyframeIntervalInSeconds: 2 },
];

const post = (body: unknown) =>
  fetch("/result", { method: "POST", body: JSON.stringify(body) }).catch(() => {});

if (new URLSearchParams(location.search).has("auto")) {
  void (async () => {
    await post({ status: "started", hidden: document.hidden });
    for (const config of SWEEP) {
      try {
        post(await run(config, 1500, 1524, 1518));
      } catch (err) {
        post({ label: config.label, error: String(err).slice(0, 200) });
      }
    }
    await post({ status: "done" });
  })();
}

createRoot(document.getElementById("root")!).render(
  React.createElement("p", { style: { color: "#fff", font: "13px monospace" } },
    "quality probe — drive it from the console: __qp.run({label, videoBitrate}, 1500, 1540, 1530)"),
);
