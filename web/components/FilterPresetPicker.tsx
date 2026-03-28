"use client";

import type { FilterPreset } from "@/lib/presets";

interface Props {
  presets: FilterPreset[];
  activeId: string | null;
  matchCounts: Record<string, number>;
  onSelect: (id: string | null) => void;
}

const TYPE_LABEL: Record<string, string> = {
  buy: "BUY",
  avoid: "AVOID",
  warning: "WARN",
};
const TYPE_COLOR: Record<string, string> = {
  buy: "var(--green)",
  avoid: "var(--red)",
  warning: "var(--yellow)",
};

export function FilterPresetPicker({ presets, activeId, matchCounts, onSelect }: Props) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: "var(--text-secondary)" }}
          >
            Analytics Presets
          </span>
          {activeId && (
            <span
              className="text-[9px] px-1.5 py-0.5 font-bold border"
              style={{ borderColor: "var(--blue)", color: "var(--blue)" }}
            >
              ACTIVE
            </span>
          )}
        </div>
        {activeId && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] hover:opacity-60 transition-opacity"
            style={{ color: "var(--text-dim)" }}
          >
            ✕ Clear preset
          </button>
        )}
      </div>

      {/* Preset grid */}
      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1">
        {presets.map((p) => {
          const isActive = activeId === p.id;
          const count = matchCounts[p.id] ?? 0;
          const typeColor = TYPE_COLOR[p.type];

          return (
            <button
              key={p.id}
              onClick={() => onSelect(isActive ? null : p.id)}
              className="relative text-left p-2.5 transition-colors"
              style={{
                background: isActive ? "var(--bg-card-hover)" : "var(--bg-surface)",
                border: `1px solid ${isActive ? p.color : "var(--border)"}`,
                borderLeft: isActive ? `3px solid ${p.color}` : "1px solid var(--border)",
              }}
              title={`${p.intent}\n\nInsight: ${p.insight}`}
            >
              {/* Type badge */}
              <div
                className="absolute top-1.5 right-1.5 text-[8px] font-black px-1 border"
                style={{ color: typeColor, borderColor: typeColor }}
              >
                {TYPE_LABEL[p.type]}
              </div>

              {/* Emoji */}
              <div className="flex items-start gap-1.5 mb-1.5">
                <span className="text-base leading-none">{p.emoji}</span>
              </div>

              <div
                className="text-[10px] font-bold leading-tight"
                style={{ color: isActive ? p.color : "var(--text-primary)" }}
              >
                {p.shortName}
              </div>
              <div className="text-[9px] mt-0.5 leading-tight" style={{ color: "var(--text-dim)" }}>
                {p.intent}
              </div>

              {/* Match count */}
              <div className="mt-2 flex items-center justify-between">
                <span
                  className="mono text-sm font-black"
                  style={{ color: count > 0 ? p.color : "var(--text-dim)" }}
                >
                  {count}
                </span>
                <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>
                  match{count !== 1 ? "es" : ""}
                </span>
              </div>

              {/* Active bottom bar */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: p.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active preset detail */}
      {activeId && (() => {
        const p = presets.find((x) => x.id === activeId);
        if (!p) return null;
        return (
          <div
            className="mx-2 mb-2 px-3 py-2 text-xs border-l-2"
            style={{
              background: "var(--bg-surface)",
              border: `1px solid var(--border)`,
              borderLeft: `3px solid ${p.color}`,
            }}
          >
            <span className="font-bold" style={{ color: p.color }}>
              {p.emoji} {p.name}
            </span>
            <span className="ml-2" style={{ color: "var(--text-secondary)" }}>
              {p.intent}
            </span>
            <span
              className="ml-2 pl-2"
              style={{ color: "var(--text-dim)", borderLeft: `1px solid var(--border)` }}
            >
              💡 {p.insight}
            </span>
          </div>
        );
      })()}
    </div>
  );
}
