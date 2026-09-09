import React from "react";
import { useRemotionEnvironment } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";

/**
 * Gates for effects the wizard's in-browser export cannot composite.
 *
 * `@remotion/web-renderer` is not Chromium — it is an emulated CSS subset drawn to a
 * canvas — so a scene that looks right in the Player tells you nothing about how it
 * exports. See docs/browser-render-best-practices.md, which this file is the local
 * implementation of §3.
 */

/**
 * True ONLY in the in-browser export.
 *
 * Not `isRendering`: that is also true for `remotion render` and `remotion still`, both of
 * which run real Chromium and composite everything correctly. Gating on `isRendering`
 * would throw the effect away in the CLI render too, which is the one output that can
 * have it.
 *
 * THE HOOK, NEVER `getRemotionEnvironment()`. That function hardcodes
 * `isClientSideRendering: false` — read its source, the field is a literal. The flag only
 * ever becomes true through `RemotionEnvironmentContext`, which @remotion/web-renderer
 * provides around the composition, and only the hook reads that context. Gating on the
 * function compiles, typechecks, and silently never fires: a first pass at these fixes did
 * exactly that and the exported MP4 came back byte-identical.
 */
export const useIsClientSideRender = (): boolean =>
  useRemotionEnvironment().isClientSideRendering;

/**
 * `<CameraMotionBlur>` everywhere it works, and a sharp pass-through in the export.
 *
 * THE BUG THIS EXISTS TO PREVENT
 * `<CameraMotionBlur>` layers N time-offset copies of its subtree at `opacity 1/N` and sums
 * them with `mix-blend-mode: plus-lighter`. The web renderer cannot composite
 * `plus-lighter`, so the copies alpha-composite instead and the whole subtree exports at
 * roughly 65% opacity — every wrapped scene comes out looking semi-transparent, with white
 * cards turning grey. It is the single most-reported export bug in the doc and it is
 * emitted by a dependency, not by our own CSS, so grepping our scenes never finds it.
 *
 * A sharp frame is the right degrade: correct additive blur is impossible there, and a
 * scene that is merely not blurred reads as fine, where a washed-out one does not.
 */
export const MotionBlur: React.FC<{
  shutterAngle: number;
  samples: number;
  children: React.ReactNode;
}> = ({ shutterAngle, samples, children }) => {
  const clientSide = useIsClientSideRender();
  if (clientSide) return <>{children}</>;
  return (
    <CameraMotionBlur shutterAngle={shutterAngle} samples={samples}>
      {children}
    </CameraMotionBlur>
  );
};
