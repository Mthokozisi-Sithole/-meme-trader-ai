"use client";

interface Props {
 score: number;
 size?: number;
 strokeWidth?: number;
 label?: string;
}

const BAND_COLOR: Record<string, string> = {
 "Strong Buy": "#00d97e",
 Watch: "#f5c543",
 Risky: "#f97316",
 Avoid: "#ff4466",
};

function getBand(score: number): string {
 if (score >= 80) return "Strong Buy";
 if (score >= 60) return "Watch";
 if (score >= 40) return "Risky";
 return "Avoid";
}

export function ScoreRing({ score, size = 80, strokeWidth = 6, label }: Props) {
 const band = getBand(score);
 const color = BAND_COLOR[band];
 const radius = (size - strokeWidth) / 2;
 const circumference = 2 * Math.PI * radius;
 const offset = circumference - (score / 100) * circumference;
 const cx = size / 2;
 const cy = size / 2;

 return (
 <div className="flex flex-col items-center gap-1">
 <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
 {/* Track */}
 <circle
 cx={cx} cy={cy} r={radius}
 fill="none"
 stroke="rgba(255,255,255,0.06)"
 strokeWidth={strokeWidth}
 />
 {/* Progress */}
 <circle
 cx={cx} cy={cy} r={radius}
 fill="none"
 stroke={color}
 strokeWidth={strokeWidth}
 strokeDasharray={circumference}
 strokeDashoffset={offset}
 strokeLinecap="round"
 style={{
 transition: "stroke-dashoffset 0.8s ease",
 filter: `drop-shadow(0 0 4px ${color})`,
 }}
 />
 </svg>
 {/* Score text overlay — centered */}
 <div
 className="mono font-black text-center leading-none"
 style={{
 marginTop: `-${size * 0.75}px`,
 fontSize: size * 0.28,
 color,
 textShadow: `0 0 8px ${color}`,
 }}
 >
 {score.toFixed(0)}
 </div>
 <div style={{ marginTop: `${size * 0.35}px` }} />
 {label && (
 <div className="text-[10px] text-center" style={{ color: "var(--text-secondary)" }}>
 {label}
 </div>
 )}
 </div>
 );
}
