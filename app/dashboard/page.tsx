import Image from "next/image";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { DashboardTable } from "@/components/DashboardTable";
import { InternsOverviewTable, type InternOverviewRow } from "@/components/InternsOverviewTable";
import { DirecteurSettings } from "@/components/DirecteurSettings";
import { DashboardLogoutButton } from "@/components/DashboardLogoutButton";
import { SiteHeader } from "@/components/SiteHeader";
import { EnseaInfoStrip } from "@/components/EnseaInfoStrip";
import { getAllPointagesWithUsers, type PointageRecord } from "@/lib/pointages";
import { getAllUsers } from "@/lib/users";
import { computeInternStats } from "@/lib/internStats";
import { computeLeaderboard } from "@/lib/leaderboard";
import { now } from "@/lib/clock";
import { schoolDateString } from "@/lib/schoolTime";
import { NOMINAL_END, NOMINAL_START } from "@/lib/config";
import { timeToMinutes } from "@/lib/timeRules";
import { Users, ClipboardList, UserCheck, AlertTriangle, UserX, Trophy, AlarmClockOff, ShieldCheck, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Nécessite les identifiants Google Sheets et un cookie de session à la requête —
// ne peut pas être pré-rendu statiquement au build.
export const dynamic = "force-dynamic";

function Kpi({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
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

function formatHeures(heures: number): string {
  const h = Math.floor(heures);
  const m = Math.round((heures - h) * 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

function LeaderboardCard({
  icon: Icon,
  label,
  entry,
  metric,
}: {
  icon: LucideIcon;
  label: string;
  entry: InternOverviewRow | null;
  metric: (entry: InternOverviewRow) => string;
}) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex items-start gap-3 px-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardDescription>{label}</CardDescription>
          {entry ? (
            <>
              <CardTitle className="text-lg">
                {entry.prenom} {entry.nom}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{metric(entry)}</p>
            </>
          ) : (
            <CardTitle className="text-lg text-muted-foreground">Pas encore de données</CardTitle>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const [pointages, users] = await Promise.all([getAllPointagesWithUsers(), getAllUsers()]);
  const nominalMinutes = timeToMinutes(NOMINAL_END) - timeToMinutes(NOMINAL_START);
  const today = schoolDateString(now());

  const pointagesByEmail = new Map<string, PointageRecord[]>();
  for (const p of pointages) {
    const list = pointagesByEmail.get(p.email) ?? [];
    list.push(p);
    pointagesByEmail.set(p.email, list);
  }

  const interns: InternOverviewRow[] = users.map((u) => ({
    email: u.email,
    prenom: u.prenom,
    nom: u.nom,
    classe: u.classe,
    statut: u.statut,
    dateInscription: schoolDateString(u.createdAt),
    stats: computeInternStats(pointagesByEmail.get(u.email) ?? [], today),
  }));

  const enCours = pointages.filter((p) => p.heureArrivee && !p.heureDepart).length;
  const aVerifier = pointages.filter((p) => p.flags.length > 0).length;
  const sansPointage = users.filter((u) => !pointagesByEmail.has(u.email)).length;
  const leaderboard = computeLeaderboard(interns);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SiteHeader title="Tableau de bord" subtitle="Directeur des études" />
          <div className="flex items-center gap-2 border-border pt-3 sm:border-l sm:pt-0 sm:pl-4">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
              <Image
                src="/directeur-coulibaly.jpg"
                alt="Romaric Coulibaly"
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-sm font-medium text-foreground">Romaric Coulibaly</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DirecteurSettings />
          <DashboardLogoutButton />
        </div>
      </div>

      <EnseaInfoStrip />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Stagiaires inscrits" value={users.length} icon={Users} />
        <Kpi label="Pointages enregistrés" value={pointages.length} icon={ClipboardList} />
        <Kpi label="Présents (en cours)" value={enCours} icon={UserCheck} />
        <Kpi label="À vérifier" value={aVerifier} icon={AlertTriangle} />
        <Kpi label="Sans aucun pointage" value={sansPointage} icon={UserX} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Classements</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LeaderboardCard
            icon={Trophy}
            label="Le plus ponctuel"
            entry={leaderboard.ponctualite}
            metric={(e) => `${e.stats.retards} retard(s)`}
          />
          <LeaderboardCard
            icon={AlarmClockOff}
            label="Retards les plus fréquents"
            entry={leaderboard.retards}
            metric={(e) => `${e.stats.retards} retard(s)`}
          />
          <LeaderboardCard
            icon={ShieldCheck}
            label="Meilleure assiduité"
            entry={leaderboard.assiduite}
            metric={(e) => `${e.stats.joursAbsence} absence(s)`}
          />
          <LeaderboardCard
            icon={TrendingUp}
            label="Le plus d'heures effectuées"
            entry={leaderboard.heures}
            metric={(e) => formatHeures(e.stats.heuresEffectuees)}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Stagiaires inscrits</h2>
        <InternsOverviewTable interns={interns} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Historique des pointages</h2>
        <DashboardTable pointages={pointages} nominalMinutes={nominalMinutes} />
      </div>
    </div>
  );
}
