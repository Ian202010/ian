import { colors as base, fontFamily, sceneStyle } from "../TopTikTok/theme";

export { fontFamily, sceneStyle };

export const colors = {
  ...base,
  water: "#3BA7FF",
  skin: "#F2C19B",
  skinDark: "#C98B63",
  blood: "#FF4D6D",
  green: "#3DDC84",
};

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
