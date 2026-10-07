import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
import { Search, Trash2, Play, Pause, Pencil, X } from "lucide-react";
import type { RankedStudent } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useReorderLock } from "@/hooks/useReorderLock";
import { useOnLogout } from "@/hooks/useOnLogout";
import { addLaps, deleteStudent } from "@/api/students";
import { notifyActionError } from "@/lib/notify";
import { EditStudentDialog } from "@/components/admin/EditStudentDialog";

interface RankingListProps {
  students: RankedStudent[];
  onLapChange?: () => void;
}

export function RankingList({ students, onLapChange }: RankingListProps) {
  const { isLoggedIn } = useAuthStore();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editStudent, setEditStudent] = useState<RankedStudent | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [hovered, setHovered] = useState(false);
  const lapsLocked = useReorderLock(students.map((s) => s.id));
  useOnLogout(() => {
    setDeleteId(null);
    setEditStudent(null);
    setExpandedId(null);
  });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Long-press handler for mobile admin actions
  const handleTouchStart = useCallback((studentId: number) => {
    if (!isLoggedIn) return;
    longPressTimer.current = setTimeout(() => {
      setExpandedId(prev => prev === studentId ? null : studentId);
    }, 500);
  }, [isLoggedIn]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Auto-scroll when enabled and not hovered
  useEffect(() => {
    if (!autoScroll || search || hovered) return;
    const el = scrollRef.current?.querySelector("[data-slot='scroll-area-viewport']") as HTMLElement | null;
    if (!el) return;

    const speed = 0.5; // px per frame
    let raf: number;
    const scroll = () => {
      el.scrollTop += speed;
      // Loop back to top when reaching bottom
      if (el.scrollTop >= el.scrollHeight - el.clientHeight) {
        el.scrollTop = 0;
      }
      raf = requestAnimationFrame(scroll);
    };
    raf = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(raf);
  }, [search, autoScroll, hovered]);

  // Show students ranked 4th and below
  const listStudents = students
    .filter((s) => s.rank > 3 || students.indexOf(s) >= 3)
    .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddLap = async (id: number, delta: number) => {
    try {
      await addLaps(id, delta);
      onLapChange?.();
    } catch (error) {
      const name = students.find((s) => s.id === id)?.name ?? "this student";
      notifyActionError(error, `Couldn't update laps for ${name}. Please try again.`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteStudent(id);
      onLapChange?.();
    } catch (error) {
      const name = students.find((s) => s.id === id)?.name ?? "the student";
      notifyActionError(error, `Couldn't delete ${name}. Please try again.`);
    } finally {
      setDeleteId(null);
    }
  };

  const deleteTarget = students.find((s) => s.id === deleteId);

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border-color)] glass-card">
      <div className="flex items-center gap-2 px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            className="pl-9 border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex h-10 w-10 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            autoScroll
              ? "border-[var(--theme-primary)] text-[var(--theme-primary)]"
              : "border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          } bg-[var(--card-bg-secondary)]`}
          title={autoScroll ? "Pause auto-scroll" : "Start auto-scroll"}
        >
          {autoScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <ScrollArea className="h-full">
        <div className="space-y-1 sm:space-y-1.5 p-3 sm:p-4">
          <AnimatePresence mode="popLayout">
            {listStudents.map((student) => (
              <motion.div
                key={student.id}
                layout
                layoutId={String(student.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="rounded-lg bg-[var(--card-bg-secondary)] overflow-hidden"
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3"
                  onTouchStart={() => handleTouchStart(student.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                >
                  {/* Rank */}
                  <div className="flex w-6 sm:w-8 items-center justify-center shrink-0">
                    <span className="text-xs sm:text-base font-bold tabular-nums text-[var(--text-muted)]">
                      {student.rank}
                    </span>
                  </div>

                  {/* Rank change indicator - hidden on small mobile */}
                  <div className="hidden sm:block w-5 shrink-0">
                    {student.rankChange !== undefined && student.rankChange !== 0 && (
                      <span
                        className="text-sm font-bold"
                        style={{
                          color: student.rankChange > 0 ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {student.rankChange > 0 ? "↑" : "↓"}
                        {Math.abs(student.rankChange)}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0 truncate text-xs sm:text-sm md:text-base text-[var(--text-primary)] text-left">
                    {student.name}
                  </div>

                  {/* House - centered between name and laps */}
                  <div
                    className="w-8 sm:w-20 text-center text-[10px] sm:text-sm font-medium shrink-0"
                    style={{ color: student.house.color }}
                  >
                    <span className="sm:hidden">{student.house.name.charAt(0)}</span>
                    <span className="hidden sm:inline">{student.house.name}</span>
                  </div>

                  {/* Lap count */}
                  <div className="flex-1 min-w-0 text-xs sm:text-base font-bold tabular-nums text-[var(--text-primary)] text-right">
                    {student.lap_count}
                  </div>

                  {/* Desktop admin controls */}
                  {isLoggedIn && (
                    <div className="hidden md:flex items-center gap-1">
                      <button
                        onClick={() => handleAddLap(student.id, -1)}
                        disabled={lapsLocked}
                        className="disabled:opacity-50 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-sm text-[var(--text-secondary)] hover:bg-[var(--card-bg-secondary)] transition-colors"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAddLap(student.id, 1)}
                        disabled={lapsLocked}
                        className="disabled:opacity-50 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] hover:bg-[var(--card-bg-secondary)] transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setEditStudent(student)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-secondary)] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(student.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[#E57373] hover:bg-[var(--card-bg-secondary)] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Mobile +/- buttons (always visible when logged in) */}
                  {isLoggedIn && (
                    <div className="flex md:hidden items-center gap-0.5">
                      <button
                        onClick={() => handleAddLap(student.id, -1)}
                        disabled={lapsLocked}
                        className="disabled:opacity-50 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-sm text-[var(--text-secondary)] active:bg-[var(--card-bg-secondary)] transition-colors"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAddLap(student.id, 1)}
                        disabled={lapsLocked}
                        className="disabled:opacity-50 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] active:bg-[var(--card-bg-secondary)] transition-colors"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile expanded admin actions (long-press to reveal) */}
                {isLoggedIn && expandedId === student.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="md:hidden flex items-center gap-2 px-2.5 pb-2 border-t border-[var(--border-color)]"
                  >
                    <button
                      onClick={() => { setEditStudent(student); setExpandedId(null); }}
                      className="flex h-9 items-center gap-1.5 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-xs text-[var(--text-secondary)] active:bg-[var(--card-bg-secondary)] transition-colors mt-2"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => { setDeleteId(student.id); setExpandedId(null); }}
                      className="flex h-9 items-center gap-1.5 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-xs text-[#E57373] active:bg-[var(--card-bg-secondary)] transition-colors mt-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => setExpandedId(null)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] mt-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border-[var(--border-color)] bg-[var(--card-bg)] w-[calc(100vw-2rem)] sm:w-auto rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">Delete Student</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-secondary)]">
              Are you sure you want to delete {deleteTarget?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--card-bg)] hover:text-[var(--text-primary)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-[#E57373] text-white hover:bg-[#EF5350]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditStudentDialog
        student={editStudent}
        open={editStudent !== null}
        onOpenChange={(open) => !open && setEditStudent(null)}
        onSuccess={onLapChange}
      />
    </div>
  );
}
