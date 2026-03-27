import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SignalCard } from "@/components/SignalCard";
import type { Signal } from "@/types";

const mockSignal: Signal = {
  id: 1,
  coin_symbol: "PEPE",
  score: 72.5,
  band: "Watch",
  score_breakdown: {
    composite: 72.5,
    sentiment: 65,
    technical: 70,
    liquidity: 80,
    momentum: 75,
  },
  trade_levels: {
    entry_low: 0.00000099,
    entry_high: 0.00000101,
    exit_target: 0.0000013,
    stop_loss: 0.00000094,
  },
  risk_level: "medium",
  risk_flags: ["low_liquidity"],
  reasoning: "PEPE scores 72.5/100 → Watch. Price up 10% in 24h.",
  created_at: "2026-03-27T12:00:00Z",
};

describe("SignalCard", () => {
  it("renders coin symbol", () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText("PEPE")).toBeInTheDocument();
  });

  it("renders band badge", () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText("Watch")).toBeInTheDocument();
  });

  it("renders risk level", () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();
  });

  it("renders risk flags", () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText("low_liquidity")).toBeInTheDocument();
  });

  it("renders reasoning", () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText(/PEPE scores/)).toBeInTheDocument();
  });

  it("shows entry/exit/sl labels", () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText("ENTRY")).toBeInTheDocument();
    expect(screen.getByText("EXIT TARGET")).toBeInTheDocument();
    expect(screen.getByText("STOP LOSS")).toBeInTheDocument();
  });
});
