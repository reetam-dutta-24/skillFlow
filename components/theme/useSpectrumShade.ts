"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { spectrumShadeIsLight } from "@/lib/spectrum-shade";

const INK = "spectrum-light-shade";

/** While Spectrum is on, mark a light shade so type can leave the default white ink. */
export function useSpectrumLightShade() {
  const [lightShade, setLightShade] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const read = () => {
      const accent = root.getAttribute("data-accent");
      const hue = Number.parseFloat(getComputedStyle(root).getPropertyValue("--spectrum-h"));
      const next = accent === "spectrum" && Number.isFinite(hue) && spectrumShadeIsLight(hue);
      const ink = clsx(next && INK);
      root.classList.toggle(INK, ink === INK);
      setLightShade(next);
    };

    read();
    const id = window.setInterval(read, 200);
    return () => {
      window.clearInterval(id);
      root.classList.remove(INK);
    };
  }, []);

  return lightShade;
}
