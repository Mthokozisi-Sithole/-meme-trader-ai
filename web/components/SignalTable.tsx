"use client";

import type { Signal } from "@/types";
import { BandBadge, RiskBadge } from "./RiskBadge";
import Link from "next/link";

function fmt(n: number) {
 if (n < 0.0001) return n.toExponential(4);
 return n.toPrecision(6);
}

interface Props {
 signals: Signal[];
 onGenerate?: (symbol: string) => void;
 generating?: string | null;
}

export function SignalTable({ signals, onGenerate, generating }: Props) {
 if (signals.length === 0) {
 return (
 <div className="text-center py-16 text-gray-400">
 No signals yet. Add coins and generate signals to get started.
 </div>
 );
 }

 return (
 <div className="overflow-x-auto border border-gray-200 shadow-sm">
 <table className="min-w-full divide-y divide-gray-200 text-sm">
 <thead className="bg-gray-50">
 <tr>
 {["Coin", "Score", "Band", "Entry", "Exit", "SL", "Risk", "Flags", ""].map((h) => (
 <th
 key={h}
 className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
 >
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-100">
 {signals.map((s) => (
 <tr key={s.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-4 py-3 font-bold text-gray-900">
 <Link href={`/coins/${s.coin_symbol}`} className="hover:underline">
 {s.coin_symbol}
 </Link>
 </td>
 <td
 className={`px-4 py-3 font-mono font-semibold ${
 s.score >= 80
 ? "text-green-700"
 : s.score >= 60
 ? "text-yellow-700"
 : s.score >= 40
 ? "text-orange-700"
 : "text-red-700"
 }`}
 >
 {s.score.toFixed(1)}
 </td>
 <td className="px-4 py-3">
 <BandBadge band={s.band} />
 </td>
 <td className="px-4 py-3 font-mono text-blue-700">
 {fmt(s.trade_levels.entry_low)}–{fmt(s.trade_levels.entry_high)}
 </td>
 <td className="px-4 py-3 font-mono text-green-700">
 {fmt(s.trade_levels.exit_target)}
 </td>
 <td className="px-4 py-3 font-mono text-red-700">
 {fmt(s.trade_levels.stop_loss)}
 </td>
 <td className="px-4 py-3">
 <RiskBadge level={s.risk_level} />
 </td>
 <td className="px-4 py-3">
 <div className="flex flex-wrap gap-1">
 {s.risk_flags.map((f) => (
 <span key={f} className="bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 ">
 {f}
 </span>
 ))}
 </div>
 </td>
 <td className="px-4 py-3">
 {onGenerate && (
 <button
 onClick={() => onGenerate(s.coin_symbol)}
 disabled={generating === s.coin_symbol}
 className="text-xs px-2 py-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
 >
 {generating === s.coin_symbol ? "..." : "Refresh"}
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 );
}
