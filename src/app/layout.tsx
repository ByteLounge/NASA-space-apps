import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MARSCOPE — Interplanetary Survival Guide | NASA Space Apps 2026",
  description: "An interactive Martian mission-planning and EVA exploration system utilizing NASA MOLA, MRO CRISM, and HiRISE planetary datasets for future human explorers.",
  keywords: ["NASA", "Space Apps Challenge 2026", "Mars", "MOLA", "CRISM", "HiRISE", "Mission Planner", "EVA Traverse", "Martian Map"],
  authors: [{ name: "MARSCOPE Mission Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-surface-darkest text-foreground antialiased select-none overflow-hidden">
        {children}
      </body>
    </html>
  );
}
