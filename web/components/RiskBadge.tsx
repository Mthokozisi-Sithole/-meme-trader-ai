import type { Band, RiskLevel } from "@/types";

const BAND_STYLES: Record<Band, string> = {
  "Strong Buy": "bg-green-100 text-green-800 border-green-300",
  Watch: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Risky: "bg-orange-100 text-orange-800 border-orange-300",
  Avoid: "bg-red-100 text-red-800 border-red-300",
};

const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-green-50 text-green-700",
  medium: "bg-yellow-50 text-yellow-700",
  high: "bg-red-50 text-red-700",
};

export function BandBadge({ band }: { band: Band }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded border text-xs font-semibold ${BAND_STYLES[band]}`}
    >
      {band}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${RISK_STYLES[level]}`}
    >
      {level.toUpperCase()}
    </span>
  );
}
