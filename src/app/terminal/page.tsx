import { Suspense } from "react";
import type { Metadata } from "next";
import { Terminal } from "@/components/terminal/Terminal";

export const metadata: Metadata = {
  title: "Terminal",
  description: "Trade every NOIR profile coin from one screen: command bar, hotkeys, Robinhood Chain and Solana.",
};

export default function TerminalPage() {
  return (
    <Suspense>
      <Terminal />
    </Suspense>
  );
}
