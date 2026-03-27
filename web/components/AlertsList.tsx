"use client";

import type { Alert } from "@/types";

const SEVERITY_STYLES = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  critical: "bg-red-50 border-red-200 text-red-800",
};

interface Props {
  alerts: Alert[];
  onMarkRead?: (id: number) => void;
}

export function AlertsList({ alerts, onMarkRead }: Props) {
  if (alerts.length === 0) {
    return <p className="text-gray-400 text-sm">No alerts.</p>;
  }
  return (
    <ul className="space-y-2">
      {alerts.map((a) => (
        <li
          key={a.id}
          className={`border rounded-lg px-4 py-3 flex items-start justify-between gap-3 ${
            SEVERITY_STYLES[a.severity]
          } ${a.is_read ? "opacity-50" : ""}`}
        >
          <div>
            <span className="font-semibold mr-2">{a.coin_symbol}</span>
            <span className="text-xs uppercase font-medium mr-2">[{a.severity}]</span>
            {a.message}
          </div>
          {!a.is_read && onMarkRead && (
            <button
              onClick={() => onMarkRead(a.id)}
              className="text-xs underline shrink-0"
            >
              Dismiss
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
