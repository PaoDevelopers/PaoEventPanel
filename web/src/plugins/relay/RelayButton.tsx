import { Flag } from "lucide-react";
import { RELAY_HASH } from "./route";

export function RelayButton() {
  return (
    <a
      href={RELAY_HASH}
      className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-xs lg:text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--card-bg-secondary)]"
    >
      <Flag className="h-4 w-4" />
      House Relay Ranking
    </a>
  );
}
