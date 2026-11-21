import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Self-hosted Poppins (public/fonts) so renders don't depend on Google's CDN.
loadFont({ family: "Poppins", url: staticFile("fonts/Poppins-500.woff2"), weight: "500" });
loadFont({ family: "Poppins", url: staticFile("fonts/Poppins-800.woff2"), weight: "800" });
export const fontFamily = "Poppins, sans-serif";

export const colors = {
  bg: "#0b0b12",
  cyan: "#25F4EE",
  pink: "#FE2C55",
  white: "#ffffff",
  muted: "#a6a6b8",
  card: "#1a1a26",
};

export const sceneStyle = {
  backgroundColor: colors.bg,
  justifyContent: "center",
  alignItems: "center",
  fontFamily,
  color: colors.white,
  padding: "120px 90px",
} as const;
