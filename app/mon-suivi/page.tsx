import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlagList } from "@/components/StatusBadge";
import { LogoutButton } from "@/components/MonSuiviClient";
import { SiteHeader } from "@/components/SiteHeader";
import { PointerAction } from "@/components/PointerAction";
import { StagiaireSettings } from "@/components/StagiaireSettings";
import { EnseaInfoStrip } from "@/components/EnseaInfoStrip";
import { SESSION_COOKIE_NAME } from "@/lib/config";
import { verifySessionToken } from "@/lib/session";
import { getPointagesForUser } from "@/lib/pointages";
import { computeInternStats } from "@/lib/internStats";
import { now } from "@/lib/clock";
import { schoolDateString } from "@/lib/schoolTime";
import { CalendarCheck2, CalendarX2, Hourglass, AlarmClock, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Nécessite le cookie de session à la requête (identité + pointages personnels) —
// ne peut pas être pré-rendu statiquement au build (comme /dashboard).
export const dynamic = "force-dynamic";

function Kpi({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex items-start gap-3 px-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDuree(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function formatHeures(heures: number): string {
  const h = Math.floor(heures);
  const m = Math.round((heures - h) * 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

export default async function MonSuiviPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;
  if (!session) {
    redirect("/pointage");
  }

  const pointages = await getPointagesForUser(session.userId);
  const today = schoolDateString(now());
  const stats = computeInternStats(pointages, today);
  const todayRecord = pointages.find((p) => p.date === today) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SiteHeader title="Mon suivi" subtitle={`${session.prenom} ${session.nom}`} />
        <div className="flex items-center gap-2">
          <StagiaireSettings />
          <LogoutButton />
        </div>
      </div>

      <EnseaInfoStrip />

      <PointerAction initialArrivee={todayRecord?.heureArrivee ?? null} initialDepart={todayRecord?.heureDepart ?? null} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Jours travaillés" value={stats.joursTravailles} icon={CalendarCheck2} />
        <Kpi label="Jours d'absence" value={stats.joursAbsence} icon={CalendarX2} />
        <Kpi
          label="Heures effectuées / attendues"
          value={`${formatHeures(stats.heuresEffectuees)} / ${formatHeures(stats.heuresAttendues)}`}
          icon={Hourglass}
        />
        <Kpi label="Retards" value={stats.retards} icon={AlarmClock} />
        <Kpi label="Départs anticipés" value={stats.departsAnticipes} icon={LogOut} />
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Arrivée</TableHead>
              <TableHead>Départ</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>À vérifier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.historique.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Aucun pointage pour le moment.
                </TableCell>
              </TableRow>
            )}
            {stats.historique.map((p) => (
              <TableRow key={p.date}>
                <TableCell className="whitespace-nowrap">{p.date}</TableCell>
                <TableCell>{p.heureArrivee ? p.heureArrivee.slice(0, 5) : "—"}</TableCell>
                <TableCell>
                  {p.heureDepart ? p.heureDepart.slice(0, 5) : p.heureArrivee ? "En cours" : "—"}
                </TableCell>
                <TableCell>{formatDuree(p.dureeMinutes)}</TableCell>
                <TableCell>
                  <FlagList flags={p.flags} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
