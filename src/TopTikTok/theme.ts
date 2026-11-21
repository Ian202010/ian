import { loadFont } from "@remotion/google-fonts/Poppins";

export const { fontFamily } = loadFont("normal", {
  weights: ["500", "800"],
  subsets: ["latin"],
});

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
