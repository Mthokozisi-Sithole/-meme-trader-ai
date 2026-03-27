import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "MemeTrader AI — Intelligence Terminal",
  description: "Real-time meme coin trading signals, DEX scanner, and market intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
        <Nav />
        <main className="max-w-[1600px] mx-auto px-4 pb-12">{children}</main>
      </body>
    </html>
  );
}
