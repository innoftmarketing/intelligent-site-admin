import { cn } from "@/lib/utils";
import type { ClientStatus } from "@/lib/clients-shared";

const STYLES: Record<ClientStatus, string> = {
  active:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  inactive:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
  locked:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
};

const LABELS: Record<ClientStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  locked: "Locked",
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STYLES[status]
      )}
    >
      {LABELS[status]}
    </span>
  );
}

export function SessionBadge({ live }: { live: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          live ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
        )}
      />
      {live ? "Session live" : "No session"}
    </span>
  );
}
