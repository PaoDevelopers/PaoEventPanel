import type { Stats } from "@/types";

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="flex-1 grid grid-cols-2 gap-2 md:gap-3">
      <div className="flex flex-col justify-center rounded-xl border border-[var(--border-color)] glass-card p-3 md:p-4">
        <div className="text-xs md:text-sm text-[var(--text-secondary)]">Total Laps</div>
        <div className="mt-0.5 md:mt-1 text-2xl md:text-3xl font-bold tabular-nums text-[var(--text-primary)]">
          {stats.total_laps}
        </div>
      </div>
      <div className="flex flex-col justify-center rounded-xl border border-[var(--border-color)] glass-card p-3 md:p-4">
        <div className="text-xs md:text-sm text-[var(--text-secondary)]">Participants</div>
        <div className="mt-0.5 md:mt-1 text-2xl md:text-3xl font-bold tabular-nums text-[var(--text-primary)]">
          {stats.total_participants}
        </div>
      </div>
    </div>
  );
}
