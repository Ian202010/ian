import { colors } from "./theme";

// A simple flat-style figure sitting side-saddle on a broom.
// `showSecret` reveals the skateboard and the real leg.
export const Rider = ({ showSecret }: { showSecret: boolean }) => (
  <svg width={760} height={620} viewBox="0 0 760 620">
    {/* broom handle */}
    <rect x={60} y={330} width={600} height={22} rx={11} fill="#8a5a2b" />
    {/* bristles */}
    <path d="M60 318 L-10 290 L-10 392 L60 364 Z" fill="#d9a441" transform="translate(30 0)" />
    {/* head */}
    <circle cx={380} cy={110} r={58} fill="#f2c9a0" />
    <path d="M322 100 Q380 30 438 100 Q420 70 380 68 Q340 70 322 100Z" fill="#3b2a20" />
    {/* body */}
    <rect x={338} y={168} width={84} height={160} rx={30} fill={colors.pink} />
    {/* arms holding broom */}
    <path d="M345 200 L300 330" stroke="#f2c9a0" strokeWidth={22} strokeLinecap="round" />
    <path d="M415 200 L460 330" stroke="#f2c9a0" strokeWidth={22} strokeLinecap="round" />
    {/* visible (fake) leg hanging down */}
    <path d="M360 320 L340 470 L380 470" stroke="#2d3a8c" strokeWidth={30} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {showSecret ? (
      <>
        {/* real leg standing on the skateboard */}
        <path d="M405 320 L420 560" stroke="#2d3a8c" strokeWidth={30} strokeLinecap="round" />
        {/* skateboard */}
        <rect x={300} y={560} width={260} height={18} rx={9} fill={colors.cyan} />
        <circle cx={340} cy={592} r={16} fill="#ddd" />
        <circle cx={520} cy={592} r={16} fill="#ddd" />
      </>
    ) : null}
  </svg>
);
