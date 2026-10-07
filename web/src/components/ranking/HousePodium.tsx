import type { HouseRanking } from "@/types";

interface HousePodiumProps {
  houses: HouseRanking[];
}

export function HousePodium({ houses }: HousePodiumProps) {
  const sorted = [...houses].sort((a, b) => b.total_laps - a.total_laps);

  if (sorted.length === 0) return null;

  const maxLaps = sorted[0]?.total_laps || 1;

  return (
    <div className="rounded-xl border border-[var(--border-color)] glass-card p-3 lg:p-4 flex-1">
      <h2 className="mb-2.5 lg:mb-3 text-sm lg:text-base font-bold text-[var(--text-primary)]">
        House Ranking
      </h2>
      <div className="flex flex-col gap-2 lg:gap-2.5">
        {sorted.map((house, idx) => {
          const barPercent = maxLaps > 0 ? (house.total_laps / maxLaps) * 100 : 0;

          return (
            <div key={house.house_id} className="flex items-center gap-2">
              {/* Rank number */}
              <span className="w-4 text-xs font-bold tabular-nums text-[var(--text-muted)] text-center shrink-0">
                {idx + 1}
              </span>

              {/* Bar + info */}
              <div className="flex-1 min-w-0">
                {/* Name row */}
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="text-xs lg:text-sm font-semibold text-[var(--text-primary)] truncate">
                    {house.name}
                  </span>
                  <span className="text-[0.6875rem] lg:text-xs font-bold tabular-nums text-[var(--text-primary)] ml-2 shrink-0">
                    {house.total_laps}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-5 lg:h-6 w-full rounded-sm bg-[var(--card-bg-secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(barPercent, 8)}%`,
                      backgroundColor: house.color,
                    }}
                  />
                </div>

                {/* Sub info */}
                <span className="text-[0.625rem] lg:text-[0.6875rem] tabular-nums text-[var(--text-muted)] leading-none mt-0.5 block">
                  {house.student_count} students
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
