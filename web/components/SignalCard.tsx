import type { Signal } from "@/types";
import { BandBadge, RiskBadge } from "./RiskBadge";
import { ScoreBar } from "./ScoreBar";

function fmt(n: number, decimals = 8) {
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(4);
  return n.toFixed(decimals).replace(/\.?0+$/, "");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function SignalCard({ signal }: { signal: Signal }) {
  const { score_breakdown: sb, trade_levels: tl } = signal;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">{signal.coin_symbol}</span>
          <BandBadge band={signal.band} />
          <RiskBadge level={signal.risk_level} />
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{signal.score.toFixed(1)}</div>
          <div className="text-xs text-gray-400">/ 100</div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-1">
        <ScoreBar label="Sentiment" value={sb.sentiment} />
        <ScoreBar label="Technical" value={sb.technical} />
        <ScoreBar label="Liquidity" value={sb.liquidity} />
        <ScoreBar label="Momentum" value={sb.momentum} />
      </div>

      {/* Trade levels */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-500 font-medium mb-1">ENTRY</div>
          <div className="font-mono text-blue-900">
            {fmt(tl.entry_low)} – {fmt(tl.entry_high)}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-green-500 font-medium mb-1">EXIT TARGET</div>
          <div className="font-mono text-green-900">{fmt(tl.exit_target)}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-xs text-red-500 font-medium mb-1">STOP LOSS</div>
          <div className="font-mono text-red-900">{fmt(tl.stop_loss)}</div>
        </div>
      </div>

      {/* Risk flags */}
      {signal.risk_flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {signal.risk_flags.map((f) => (
            <span
              key={f}
              className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Reasoning */}
      <p className="text-sm text-gray-600 leading-relaxed">{signal.reasoning}</p>

      <div className="text-xs text-gray-400">{fmtDate(signal.created_at)}</div>
    </div>
  );
}
