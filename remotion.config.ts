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

// The film's back half is slow pans and scrolls over crisp UI — the Spaces grid drifts,
// the phones scroll — and that is the worst case for x264 at its defaults: every frame
// re-quantizes all that moving detail, which on screen reads as a wavy crawl. (The
// reference footage never shows it because its own encode already softened it.) Measured
// against a lossless frame dump of the worst window, 1500-1540: SSIM 0.9885 at the
// default crf 18 / medium, 0.9917 at crf 15 / slow — 28% of the encode error gone for
// ~40% more file. crf 13 was +29% size again for a third of that gain; not worth it.
// These reach repo renders only; the wizard's copy-paste command carries the same flags.
Config.setCrf(15);
Config.setX264Preset("slow");
Config.setOverwriteOutput(true);
