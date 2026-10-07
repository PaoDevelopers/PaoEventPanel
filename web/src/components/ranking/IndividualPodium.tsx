import { useState } from "react";
import type { RankedStudent } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useReorderLock } from "@/hooks/useReorderLock";
import { useOnLogout } from "@/hooks/useOnLogout";
import { addLaps, deleteStudent } from "@/api/students";
import { notifyActionError } from "@/lib/notify";
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
import { Trash2, Pencil } from "lucide-react";
import { EditStudentDialog } from "@/components/admin/EditStudentDialog";

interface IndividualPodiumProps {
  students: RankedStudent[];
  onLapChange?: () => void;
}

export function IndividualPodium({ students, onLapChange }: IndividualPodiumProps) {
  const { isLoggedIn } = useAuthStore();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editStudent, setEditStudent] = useState<RankedStudent | null>(null);
  const lapsLocked = useReorderLock(students.map((s) => s.id));
  useOnLogout(() => {
    setDeleteId(null);
    setEditStudent(null);
  });
  const top3 = students.slice(0, 3);
  if (top3.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[var(--border-color)] glass-card py-16 text-lg text-[var(--text-secondary)]">
        No participants yet
      </div>
    );
  }

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

  // Display order: 2nd, 1st, 3rd
  const heights = [108, 148, 88];
  const mobileHeights = [72, 100, 56];
  const positionOrder = top3.length >= 3 ? [1, 0, 2] : top3.length === 2 ? [1, 0] : [0];

  return (
    <div className="rounded-xl border border-[var(--border-color)] glass-card p-3 sm:p-4 md:p-6 2xl:p-8">
      <div className="flex items-end justify-center gap-1.5 sm:gap-3 md:gap-5 2xl:gap-8">
        {positionOrder.map((idx) => {
          const student = top3[idx];
          if (!student) return null;
          const height = heights[idx === 0 ? 1 : idx === 1 ? 0 : 2];
          const mobileHeight = mobileHeights[idx === 0 ? 1 : idx === 1 ? 0 : 2];

          return (
            <div
              key={student.id}
              className="flex flex-1 flex-col items-center min-w-0"
            >
              <div className="mb-1.5 sm:mb-2 md:mb-3 text-center w-full">
                <div className="text-xs sm:text-sm md:text-lg 2xl:text-xl font-semibold text-[var(--text-primary)] truncate max-w-full px-1">
                  {student.name}
                </div>
                <div className="text-[10px] sm:text-xs md:text-base text-[var(--text-secondary)]">
                  {student.lap_count} laps
                </div>
              </div>
              <div
                className="w-full rounded-t-lg md:rounded-t-xl flex items-start justify-center pt-1.5 sm:pt-2 md:pt-3 transition-all duration-500"
                style={{
                  height: `clamp(${mobileHeight}px, 10vw, ${height}px)`,
                  backgroundColor: student.house.color,
                }}
              >
                <span className="text-lg sm:text-xl md:text-3xl font-bold text-white">
                  {student.rank}
                </span>
              </div>
              {isLoggedIn && (
                <div className="flex items-center gap-0.5 sm:gap-1 mt-1.5 sm:mt-2">
                  <button
                    onClick={() => handleAddLap(student.id, -1)}
                    disabled={lapsLocked}
                    className="disabled:opacity-50 flex h-9 w-9 sm:h-8 sm:w-8 md:h-7 md:w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--card-bg)] active:bg-[var(--card-bg)] transition-colors"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleAddLap(student.id, 1)}
                    disabled={lapsLocked}
                    className="disabled:opacity-50 flex h-9 w-9 sm:h-8 sm:w-8 md:h-7 md:w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-sm text-[var(--text-primary)] hover:bg-[var(--card-bg)] active:bg-[var(--card-bg)] transition-colors"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setEditStudent(student)}
                    className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--card-bg)] transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(student.id)}
                    className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg-secondary)] text-[#E57373] hover:bg-[var(--card-bg)] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
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
