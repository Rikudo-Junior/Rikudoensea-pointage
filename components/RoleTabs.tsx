import Link from "next/link";
import { cn } from "@/lib/utils";

export function RoleTabs({ active }: { active: "stagiaire" | "directeur" }) {
  return (
    <div className="mb-6 flex gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
      <Link
        href="/pointage"
        className={cn(
          "flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition-colors",
          active === "stagiaire"
            ? "bg-secondary text-secondary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        Stagiaire
      </Link>
      <Link
        href="/dashboard/login"
        className={cn(
          "flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition-colors",
          active === "directeur"
            ? "bg-secondary text-secondary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        Directeur des études
      </Link>
    </div>
  );
}
