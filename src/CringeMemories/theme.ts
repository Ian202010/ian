import { colors as base, fontFamily, sceneStyle } from "../TopTikTok/theme";

export { fontFamily, sceneStyle };

export const colors = {
  ...base,
  amber: "#FFB020",
  purple: "#9B6BFF",
  green: "#3DDC84",
};

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
