import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Touch screens get 44px targets; mouse and trackpad keep the compact buttons
export const adminButtonClass =
  "flex h-11 w-11 pointer-fine:h-7 pointer-fine:w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] transition-colors hover:bg-[var(--card-bg-secondary)] active:bg-[var(--card-bg-secondary)] disabled:opacity-50";

export const adminIconClass = "h-4 w-4 pointer-fine:h-3.5 pointer-fine:w-3.5";

interface LapControlsProps {
  name: string;
  disabled?: boolean;
  onChange: (delta: number) => void;
  buttonClassName?: string;
}

export function LapControls({ name, disabled, onChange, buttonClassName }: LapControlsProps) {
  return (
    <>
      <button
        type="button"
        aria-label={`Remove a lap from ${name}`}
        disabled={disabled}
        onClick={() => onChange(-1)}
        className={cn(adminButtonClass, "text-[var(--text-secondary)]", buttonClassName)}
      >
        <Minus className={adminIconClass} />
      </button>
      <button
        type="button"
        aria-label={`Add a lap for ${name}`}
        disabled={disabled}
        onClick={() => onChange(1)}
        className={cn(adminButtonClass, "text-[var(--text-primary)]", buttonClassName)}
      >
        <Plus className={adminIconClass} />
      </button>
    </>
  );
}
