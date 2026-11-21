import { colors } from "./theme";

// Palm-side fingertip. `wrinkle` goes from 0 (smooth) to 1 (fully pruney).
export const Finger: React.FC<{ wrinkle: number; width?: number }> = ({
  wrinkle,
  width = 300,
}) => {
  const rows = [110, 150, 190, 230, 270, 310, 350, 390];
  const squeeze = 1 - wrinkle * 0.04;
  return (
    <svg viewBox="0 0 300 500" width={width} height={(width * 500) / 300}>
      <g style={{ transformOrigin: "150px 500px", scale: `${squeeze} 1` }}>
        <path
          d="M55 500 L55 160 Q55 30 150 30 Q245 30 245 160 L245 500 Z"
          fill={colors.skin}
          stroke={colors.skinDark}
          strokeWidth={6}
        />
        {rows.map((y, i) => {
          const amp = 16 * wrinkle * (i % 2 === 0 ? 1 : -1);
          const inset = y < 140 ? 30 : 0;
          return (
            <path
              key={y}
              d={`M${80 + inset} ${y} Q${115 + inset / 2} ${y - amp} 150 ${y} T${220 - inset} ${y}`}
              fill="none"
              stroke={colors.skinDark}
              strokeWidth={5}
              strokeLinecap="round"
              opacity={wrinkle}
            />
          );
        })}
      </g>
    </svg>
  );
};
