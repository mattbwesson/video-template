/**
 * Rendering the finished cut to an MP4 in the operator's own browser.
 *
 * `@remotion/web-renderer` draws the composition to a canvas and encodes it with WebCodecs,
 * so there is no server, no queue and no upload — the operator clicks Render and gets a file.
 * That is the whole appeal, and it comes with a real caveat, which is that the canvas
 * renderer is NOT the renderer the `<Player>` above it uses.
 *
 * See docs/browser-render-best-practices.md. The short version: the Player and the CLI use
 * full Chromium; this uses an emulated CSS subset. A scene looking right in the preview says
 * nothing about how it exports, and several things this film is built on — cross-root
 * `<use href="#…">` icon sprites, `clip-path` irises, `mix-blend-mode`, `backdrop-filter` —
 * are on the renderer's own unsupported list. `renderReadiness()` is what turns that from a
 * surprise into a warning the operator sees before they spend the time.
 *
 * The import is dynamic on purpose: the package pulls in WebCodecs plumbing and mediabunny,
 * which is a lot of bytes for a wizard most of whose users never press the button.
 *
 * ---------------------------------------------------------------------------------------
 * FIDELITY, AS MEASURED — not as guessed
 *
 * This is now the ONLY way a finished video leaves the wizard, so what it gets wrong is not
 * an inconvenience, it is the product. It is being brought into line one frame at a time,
 * against stills taken through this same pipeline.
 *
 * Fixed, and verified through a still:
 *
 *   - The missing icons. The Workvivo library was `<symbol>` + `<use href="#…">` and the
 *     canvas rasterizer does not resolve a `<use>` into a `<defs>` in a different `<svg>`
 *     root — so the whole nav rail, every card header and the composer came out blank.
 *     Paths are inlined per consumer now.
 *   - Photos set as CSS `background-image` did not appear; they are real `<img>` elements.
 *   - Masks and radial gradients, which the renderer drops.
 *
 * Known outstanding, each with a row in docs/browser-render-best-practices.md §5:
 * `clip-path` (every iris transition), `mix-blend-mode`, `backdrop-filter`,
 * `filter: blur()`, and `z-index` ordering — the last of which means stacking has to read
 * correctly by DOM order.
 *
 * The UI still says "preview quality", and will until a full export has been compared frame
 * for frame against the Player. Take it off when that is true, not before.
 * ---------------------------------------------------------------------------------------
 */

import type { VideoInputProps } from "../src/customize/videoCopy";

/** What the caller needs to draw a progress bar. */
export type RenderProgress = {
  /** 0-1 over the whole job, encode included. */
  progress: number;
  renderedFrames: number;
  encodedFrames: number;
  /** Milliseconds, or null while the estimate is still settling. */
  estimatedMs: number;
};

export type RenderHandle = {
  /** Resolves to the finished file. Rejects with `RENDER_ABORTED` if cancelled. */
  done: Promise<Blob>;
  cancel: () => void;
};

/** Thrown (as a message) when the operator cancels. Checked by the caller, not shown raw. */
export const RENDER_ABORTED = "RENDER_ABORTED";

let modulePromise: Promise<typeof import("@remotion/web-renderer")> | null = null;

/**
 * Load the renderer once and keep it.
 *
 * Also the reason a capability check can be offered before the button is pressed: the module
 * has to be in memory either way, and warming it on the reveal screen means the click itself
 * is not waiting on a 1 MB import.
 */
export const loadRenderer = (): Promise<typeof import("@remotion/web-renderer")> => {
  modulePromise ??= import("@remotion/web-renderer");
  return modulePromise;
};

export type Readiness = {
  /** False when the browser cannot encode at all — no WebCodecs, no hardware, etc. */
  supported: boolean;
  /** Why not, in the renderer's own words. Empty when supported. */
  blockers: string[];
};

/**
 * Ask the renderer whether this browser can encode the composition at all.
 *
 * This covers the ENVIRONMENT (WebCodecs, codec availability, cross-origin isolation), not
 * the composition's CSS. Nothing can ask the latter without rendering a frame, which is what
 * the still-check in the docs is for.
 */
export const renderReadiness = async (
  width: number,
  height: number,
): Promise<Readiness> => {
  try {
    const { canRenderMediaOnWeb } = await loadRenderer();
    const res = await canRenderMediaOnWeb({
      container: "mp4",
      videoCodec: "h264",
      audioCodec: "aac",
      width,
      height,
    });
    return {
      supported: res.canRender,
      // Warnings are not blockers — the renderer resolves around them (a different codec,
      // a different output target) and still produces a file.
      blockers: res.issues
        .filter((i) => i.severity === "error")
        .map((i) => i.message),
    };
  } catch (err) {
    return {
      supported: false,
      blockers: [err instanceof Error ? err.message : "Could not load the renderer."],
    };
  }
};

/**
 * How hard the encoder is told to try.
 *
 * There is no CRF here. The CLI hands frames to x264, which is quality-targeted — `crf 15`
 * means "spend whatever bits this frame needs" — and can be told to think longer with
 * `--preset slow`. WebCodecs has neither: it is one pass at a BITRATE, and `videoBitrate`
 * is the only lever that changes what comes out of a given rasterization. Encode time
 * barely moves with it, because this render is bound by decoding the 212-second reference
 * video and drawing the DOM, not by the encoder.
 *
 * `medium` is the library default and, at 1920x1080 h264, means exactly 3 Mbps
 * (mediabunny: 3 Mbps reference at 1080p x 1.0 for AVC x 1.0 for medium).
 *
 * For comparison, a CLI render of this film at `crf 15 / slow` averages 3.51 Mbps — and
 * that is x264 in its slowest useful mode, which gets perhaps twice the quality per bit
 * of the platform hardware encoder WebCodecs hands us. Matching the file we ship from the
 * repo therefore means asking for several times its average bitrate, not the same one.
 *
 * 12 Mbps — written as a number rather than the `"very-high"` it used to be, because that
 * string IS 12 Mbps here and the number says so without a lookup: mediabunny scales a
 * 3 Mbps 1080p AVC reference by 4 for `very-high`, which is the top of its named scale.
 * 6 Mbps is the fallback if ~320 MB for the 212-second cut ever becomes the problem, and
 * is still comfortably above parity.
 *
 * THINGS TRIED AND REJECTED, so they are not re-tried from first principles:
 *
 *   - `hardwareAcceleration: "prefer-software"`, on the theory that a software encoder
 *     would close the quality-per-bit gap. Measured identical — 165 vs 166 fps at 1080p,
 *     86 vs 81 at 2880x1620 — i.e. the browser ignores the hint. Left unset.
 *   - Supersampling: rasterize at 1.5x, then downscale to 1080p in a second pass. The one
 *     lever bitrate cannot pull, since at scale 1 the DOM is drawn straight onto a 1080p
 *     grid and no number of bits recovers an edge that was never sampled. Built, shipped
 *     behind a toggle, and removed: ~6x the render time (25-30 min against 4-5) for no
 *     difference anyone could see. docs/browser-render-best-practices.md §8 keeps the
 *     measurements and the two library bugs it turned up.
 */
const VIDEO_BITRATE = 12_000_000;

/**
 * A keyframe every two seconds rather than the default five.
 *
 * This cut changes shot constantly and the moves are whip-pans and irises, which is the
 * case that costs a P-frame the most. Nothing guarantees the encoder inserts an I-frame
 * on a hard cut, and when it does not, the frames after that cut are predicted from a
 * picture with nothing in common with them. Two seconds also makes the file scrub
 * properly in QuickTime, which is where these get watched.
 */
const KEYFRAME_INTERVAL_SECONDS = 2;

export type RenderRequest = {
  inputProps: VideoInputProps;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  onProgress: (p: RenderProgress) => void;
};

/**
 * Start a render. Returns immediately with a handle; the file arrives on `done`.
 *
 * `outputTarget: "web-fs"` streams frames to the browser's private filesystem instead of
 * holding them in memory. At 5300 frames of 1920x1080 an arraybuffer target is hundreds of
 * megabytes of live heap and the tab dies partway through; web-fs is what makes a film this
 * long finishable on a laptop.
 */
export const startRender = ({
  inputProps,
  durationInFrames,
  fps,
  width,
  height,
  onProgress,
}: RenderRequest): RenderHandle => {
  const controller = new AbortController();

  const done = (async () => {
    const { renderMediaOnWeb } = await loadRenderer();
    // Imported here rather than at module scope so the composition (and the whole scene
    // tree behind it) is not pulled into the wizard's initial bundle.
    const { CustomizedWorkvivo } = await import("../src/CustomizedWorkvivo");

    const result = await renderMediaOnWeb({
      composition: {
        id: "CustomizedWorkvivo",
        component: CustomizedWorkvivo,
        durationInFrames,
        fps,
        width,
        height,
      },
      inputProps,
      container: "mp4",
      videoCodec: "h264",
      audioCodec: "aac",
      outputTarget: "web-fs",
      signal: controller.signal,
      videoBitrate: VIDEO_BITRATE,
      keyframeIntervalInSeconds: KEYFRAME_INTERVAL_SECONDS,
      // 192 kbps AAC rather than the default 128. Two megabytes over the whole cut, on a
      // soundtrack that carries the film's only music.
      audioBitrate: "high",
      // The reference video underneath every scene is a 212-second 1920x1080 file. The
      // default cache is far smaller than one decode pass over it, so frames get re-decoded
      // constantly; 512 MB keeps the working set resident and is the single biggest lever
      // on how long this takes.
      mediaCacheSizeInBytes: 512 * 1024 * 1024,
      onProgress: (p) =>
        onProgress({
          progress: p.progress,
          renderedFrames: p.renderedFrames,
          encodedFrames: p.encodedFrames,
          estimatedMs: p.renderEstimatedTime,
        }),
    });

    return result.getBlob();
  })();

  return { done, cancel: () => controller.abort() };
};

/**
 * One frame through the REAL export pipeline, for checking fidelity without a full encode.
 *
 * docs/browser-render-best-practices.md §4: the Player cannot tell you how a scene exports,
 * because it is a different renderer. This is the cheap way to find out — seconds instead of
 * minutes — and it lives here rather than in a console snippet because it has to run inside
 * the app's own module graph. Importing the composition separately (with a cache-buster, as
 * the doc suggests) loads a second copy of React and Remotion, and the render then dies on
 * "Invalid hook call" long before it can tell you anything about CSS.
 *
 * Dev-only in practice; nothing in the shipped UI calls it.
 */
export const renderStill = async (
  frame: number,
  inputProps: Partial<VideoInputProps> = {},
): Promise<Blob> => {
  const { renderStillOnWeb } = await loadRenderer();
  const { CustomizedWorkvivo } = await import("../src/CustomizedWorkvivo");
  const { CUSTOMIZED_CUT_DURATION } = await import("../src/WorkvivoCut");

  const still = await renderStillOnWeb({
    composition: {
      id: "CustomizedWorkvivo",
      component: CustomizedWorkvivo,
      durationInFrames: CUSTOMIZED_CUT_DURATION,
      fps: 25,
      width: 1920,
      height: 1080,
    },
    frame,
    inputProps: inputProps as VideoInputProps,
    delayRenderTimeoutInMilliseconds: 180_000,
  });
  return still.blob({ format: "png" });
};

/** Hand the finished file to the operator. */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Long enough for the download to have been handed to the browser; revoking immediately
  // cancels it in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

/** `northwind-logistics` — safe on every filesystem, and never empty. */
export const companySlug = (company: string): string =>
  company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "video";

/** `workvivo-northwind-logistics.mp4` — safe on every filesystem. */
export const renderFilename = (company: string): string =>
  `workvivo-${companySlug(company)}.mp4`;
