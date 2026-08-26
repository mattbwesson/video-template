import React from "react";
import { staticFile } from "remotion";
import { useCustomization } from "../../customize/CustomizationProvider";

export const WorkvivoHero: React.FC = () => {
  const { image, header, logo, copy } = useCustomization();
  const hdr = header("home.hero");
  return (
    <div
      data-vc-slot="home.hero.0"
      className="hero"
      style={{
        // Wash colour and opacity; `.hero::after` reads them, falling back to the brand.
        ...hdr.style,
      }}
    >
      {/* The photo as a real <img> under the wash — the export drops CSS background
          photos (web/renderProbe.tsx). `.hero` is position:relative; the ::after wash
          keeps painting over this because pseudo-elements follow children in paint
          order. */}
      <img
        src={image(
          "home.hero.0",
          staticFile("fillers/190206084405_01_spotify_office_file_d0396b0d1b.webp"),
        )}
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover" }}
        alt=""
      />
      {hdr.showLogo && (
        <img className="heroM" src={logo.onDark} alt={copy.companyName} />
      )}
    </div>
  );
};
