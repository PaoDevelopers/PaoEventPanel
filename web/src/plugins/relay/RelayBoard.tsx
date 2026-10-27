import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Moon, RotateCcw, Sun } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useDarkMode } from "@/hooks/useDarkMode";
import { usePolling } from "@/hooks/usePolling";
import { useReorderLock } from "@/hooks/useReorderLock";
import { notifyActionError } from "@/lib/notify";
import { LoginDialog } from "@/components/admin/LoginDialog";
import { LapControls } from "@/components/ranking/LapControls";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addRelayLaps, getRelayRankings, resetRelay, setRelayLaps } from "./api";

const POLL_INTERVAL = 5000;

// Size comes from the wrapper (scales with screen height, which the rows share, and width for portrait phones)
const lapsTextClass = "text-[length:inherit] font-bold leading-none tabular-nums text-[var(--text-primary)]";

const barButtonClass =
  "flex h-11 pointer-fine:h-10 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--card-bg-secondary)]";

export function RelayBoard() {
  const { isLoggedIn, user } = useAuthStore();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { data, refresh } = usePolling(getRelayRankings, POLL_INTERVAL);
  const [showLogin, setShowLogin] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editing, setEditing] = useState<{ houseId: number; value: string } | null>(null);

  const houses = data ?? [];
  const lapsLocked = useReorderLock(houses.map((h) => h.house_id));
  const maxLaps = Math.max(...houses.map((h) => h.laps), 1);
  const isSuperAdmin = isLoggedIn && user?.role === "super_admin";

  const run = async (action: () => Promise<unknown>, errorMessage: string) => {
    try {
      await action();
    } catch (error) {
      notifyActionError(error, errorMessage);
    }
    refresh();
  };

  const commitEdit = () => {
    if (!editing) return;
    const laps = Number(editing.value);
    setEditing(null);
    if (Number.isInteger(laps) && laps >= 0) {
      run(() => setRelayLaps(editing.houseId, laps), "Couldn't set the relay laps");
    }
  };

  return (
    <div className="relative z-10 flex h-dvh flex-col gap-3 p-3 md:p-6 max-w-[120rem] mx-auto">
      {/* Narrow screens give the title its own line instead of truncating it */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        <a href="#" className={barButtonClass}>
          <ArrowLeft className="h-4 w-4" />
          Rankings
        </a>
        <h1 className="order-last basis-full px-1 text-2xl font-bold text-[var(--text-primary)] sm:order-none sm:basis-auto sm:flex-1 sm:min-w-0 sm:truncate sm:px-2 md:text-[clamp(1.5rem,2.2vw,2.5rem)]">
          House Relay Ranking
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {isSuperAdmin && (
            <button type="button" className={barButtonClass} onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
          {!isLoggedIn && (
            <button type="button" className={barButtonClass} onClick={() => setShowLogin(true)}>
              Sign In
            </button>
          )}
          <button
            type="button"
            onClick={toggleDarkMode}
            className={barButtonClass}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col gap-2 sm:gap-3">
        {houses.map((house) => (
          <motion.div
            key={house.house_id}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            // Phones: name and laps share the top line, bar and controls the second, so the bar keeps its width.
            // Wider: laps and controls move into their own columns beside the name and bar.
            className="grid flex-1 min-h-0 grid-cols-[auto_minmax(0,1fr)_auto] content-center items-center gap-x-3 gap-y-2 rounded-xl border border-[var(--border-color)] glass-card px-4 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-x-[clamp(1rem,2vw,2.5rem)] sm:px-[clamp(1.25rem,3vw,3.5rem)]"
          >
            <span className="row-span-2 min-w-[1.2em] text-center text-[clamp(1.5rem,min(7dvh,9vw),5.5rem)] font-bold leading-none tabular-nums text-[var(--text-muted)]">
              {house.rank}
            </span>
            <div className="col-start-2 row-start-1 self-end truncate text-[clamp(1.125rem,min(4.5dvh,6vw),3.5rem)] font-bold leading-tight text-[var(--text-primary)]">
              {house.name}
            </div>
            <div
              className={cn(
                "col-start-2 row-start-2 self-start h-[clamp(0.625rem,1.6dvh,1.5rem)] w-full overflow-hidden rounded-full bg-[var(--card-bg-secondary)]",
                !isLoggedIn && "col-span-2 sm:col-span-1",
              )}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max((house.laps / maxLaps) * 100, 2)}%`, backgroundColor: house.color }}
              />
            </div>
            {/* Fixed min width (fits 3 digits) so every row's bar ends at the same x */}
            <div className="col-start-3 row-start-1 min-w-[2.3em] text-right text-[clamp(2.25rem,min(10dvh,13vw),8rem)] sm:row-span-2">
              {editing?.houseId === house.house_id ? (
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  autoFocus
                  aria-label={`Relay laps for ${house.name}`}
                  value={editing.value}
                  onChange={(e) => setEditing({ houseId: house.house_id, value: e.target.value })}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className={cn(lapsTextClass, "w-[3.2em] rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-secondary)] px-1 text-right")}
                />
              ) : isLoggedIn ? (
                <button
                  type="button"
                  title="Tap to set laps"
                  aria-label={`Set relay laps for ${house.name}, currently ${house.laps}`}
                  onClick={() => setEditing({ houseId: house.house_id, value: String(house.laps) })}
                  className={cn(lapsTextClass, "rounded-lg px-1 transition-colors hover:bg-[var(--card-bg-secondary)] active:bg-[var(--card-bg-secondary)]")}
                >
                  {house.laps}
                </button>
              ) : (
                <span className={cn(lapsTextClass, "block px-1")}>{house.laps}</span>
              )}
            </div>
            {isLoggedIn && (
              <div className="col-start-3 row-start-2 flex items-center justify-end gap-1.5 sm:col-start-4 sm:row-start-1 sm:row-span-2">
                <LapControls
                  name={house.name}
                  disabled={lapsLocked}
                  onChange={(delta) => run(() => addRelayLaps(house.house_id, delta), "Couldn't change the relay laps")}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
      <AlertDialog open={confirmReset && isSuperAdmin} onOpenChange={setConfirmReset}>
        <AlertDialogContent className="border-[var(--border-color)] bg-[var(--card-bg)] w-[calc(100vw-2rem)] sm:w-auto rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">Reset Relay</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-secondary)]">
              Set every house's relay laps back to 0? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--card-bg)] hover:text-[var(--text-primary)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmReset(false);
                run(resetRelay, "Couldn't reset the relay");
              }}
              className="bg-[#E57373] text-white hover:bg-[#EF5350]"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
