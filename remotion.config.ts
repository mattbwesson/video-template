import { Config } from "@remotion/cli/config";

// PNG, not JPEG. The renderer screenshots every frame and hands the images to the
// encoder; with JPEG screenshots the DCT quantization noise lands differently on every
// frame, and on the rebuilt UI scenes — flat colour, crisp text — that reads as a faint
// wavy shimmer in the final MP4. The reference footage hides it under its own grain,
// which is why only the DOM-built scenes looked wrong. Measured on a static hold
// (frames 4200-4230): frame-to-frame luma diff 1.55 with JPEG, 1.15 with PNG, at no
// measurable render-time cost — the render is decode-bound, not screenshot-bound.
//
// This file only reaches renders run from the repo. The serve-URL command the wizard
// hands out carries --image-format=png explicitly, because a config file cannot follow
// the bundle to another machine.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
