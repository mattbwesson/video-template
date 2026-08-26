import React, { useEffect, useRef } from "react";

/**
 * The purple wash behind the wizard.
 *
 * It is authored on a fixed 1920x1080 stage and scaled to cover the viewport, so the
 * glows keep their relative positions at any window size instead of the gradients
 * restretching as the page resizes.
 */

const SPECKS = [
  { left: "10.2%", top: "18.5%", size: 10, delay: "-0s" },
  { left: "12.9%", top: "21.0%", size: 15, delay: "-1.7s" },
  { left: "3.6%", top: "62.5%", size: 13, delay: "-3.1s" },
  { left: "34.6%", top: "96.0%", size: 12, delay: "-2.2s" },
  { left: "49.7%", top: "74.5%", size: 11, delay: "-4.4s" },
  { left: "46.9%", top: "76.5%", size: 9, delay: "-5.6s" },
  { left: "60.5%", top: "80.5%", size: 9, delay: "-1.1s" },
  { left: "71.0%", top: "40.0%", size: 11, delay: "-2.8s" },
  { left: "86.0%", top: "26.0%", size: 10, delay: "-0.6s" },
  { left: "92.5%", top: "66.0%", size: 8, delay: "-3.9s" },
  { left: "24.0%", top: "88.0%", size: 9, delay: "-5.0s" },
  { left: "78.5%", top: "84.5%", size: 9, delay: "-4.1s" },
];

export const Backdrop: React.FC = () => {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fit = () => {
      if (!stage.current) return;
      const k = Math.max(window.innerWidth / 1920, window.innerHeight / 1080);
      stage.current.style.transform = `translate(-50%,-50%) scale(${k})`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="vc-bg" aria-hidden="true">
      <div className="vc-bgstage" ref={stage}>
        <div className="vc-glow vc-wash" />
        <div className="vc-glow vc-band" />
        <div className="vc-glow vc-bloom" />
        <div className="vc-glow vc-left" />
        <div className="vc-glow vc-right" />
        {SPECKS.map((s, i) => (
          <i
            key={i}
            className="vc-speck"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
};
