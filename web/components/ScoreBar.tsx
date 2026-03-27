interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
}

export function ScoreBar({ label, value, max = 100 }: ScoreBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  const color =
    pct >= 80
      ? "bg-green-500"
      : pct >= 60
      ? "bg-yellow-400"
      : pct >= 40
      ? "bg-orange-400"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 text-gray-500 text-right">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-gray-700 font-mono">{value.toFixed(0)}</span>
    </div>
  );
}
