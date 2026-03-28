import type { Band, RiskLevel } from "@/types";

const BAND_COLOR: Record<Band, { color: string; bg: string }> = {
  "Strong Buy": { color: "var(--green)", bg: "rgba(0,217,126,0.1)" },
  Watch:        { color: "var(--yellow)", bg: "rgba(245,197,67,0.1)" },
  Risky:        { color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  Avoid:        { color: "var(--red)", bg: "rgba(255,68,102,0.1)" },
};

const RISK_COLOR: Record<RiskLevel, { color: string }> = {
  low:     { color: "var(--green)" },
  medium:  { color: "var(--yellow)" },
  high:    { color: "#f97316" },
  extreme: { color: "var(--red)" },
};

export function BandBadge({ band }: { band: Band }) {
  const s = BAND_COLOR[band] ?? BAND_COLOR["Avoid"];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border"
      style={{ color: s.color, background: s.bg, borderColor: s.color }}
    >
      {band}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const s = RISK_COLOR[level] ?? RISK_COLOR["high"];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase border"
      style={{ color: s.color, borderColor: s.color }}
    >
      {level}
    </span>
  );
}
