import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// The background is a WebGL shader; Chromium's default renderer draws nothing
// headless. Use "swangle" instead when rendering on Linux/Lambda.
Config.setChromiumOpenGlRenderer("angle");
