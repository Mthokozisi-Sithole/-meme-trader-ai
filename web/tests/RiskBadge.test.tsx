import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BandBadge, RiskBadge } from "@/components/RiskBadge";

describe("BandBadge", () => {
 it("renders Strong Buy", () => {
 render(<BandBadge band="Strong Buy" />);
 expect(screen.getByText("Strong Buy")).toBeInTheDocument();
 });

 it("renders Watch", () => {
 render(<BandBadge band="Watch" />);
 expect(screen.getByText("Watch")).toBeInTheDocument();
 });

 it("renders Risky", () => {
 render(<BandBadge band="Risky" />);
 expect(screen.getByText("Risky")).toBeInTheDocument();
 });

 it("renders Avoid", () => {
 render(<BandBadge band="Avoid" />);
 expect(screen.getByText("Avoid")).toBeInTheDocument();
 });
});

describe("RiskBadge", () => {
 it("renders LOW for low risk", () => {
 render(<RiskBadge level="low" />);
 expect(screen.getByText("LOW")).toBeInTheDocument();
 });

 it("renders MEDIUM for medium risk", () => {
 render(<RiskBadge level="medium" />);
 expect(screen.getByText("MEDIUM")).toBeInTheDocument();
 });

 it("renders HIGH for high risk", () => {
 render(<RiskBadge level="high" />);
 expect(screen.getByText("HIGH")).toBeInTheDocument();
 });
});
