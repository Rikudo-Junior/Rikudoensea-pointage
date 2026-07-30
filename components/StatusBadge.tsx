import { Badge } from "@/components/ui/badge";
import { FLAG_LABELS } from "@/lib/flagLabels";
import type { Flag } from "@/lib/timeRules";
import { cn } from "@/lib/utils";

export function FlagBadge({ flag }: { flag: Flag }) {
  const meta = FLAG_LABELS[flag];
  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-medium",
        meta.tone === "danger"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
      )}
    >
      {meta.label}
    </Badge>
  );
}

export function FlagList({ flags }: { flags: Flag[] }) {
  if (flags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((flag) => (
        <FlagBadge key={flag} flag={flag} />
      ))}
    </div>
  );
}
