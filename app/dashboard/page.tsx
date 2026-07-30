import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { DashboardTable } from "@/components/DashboardTable";
import { getAllPointages } from "@/lib/sheets";
import { NOMINAL_END, NOMINAL_START } from "@/lib/config";
import { timeToMinutes } from "@/lib/timeRules";

// Nécessite les identifiants Google Sheets et un cookie de session à la requête —
// ne peut pas être pré-rendu statiquement au build.
export const dynamic = "force-dynamic";

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="px-4">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const pointages = await getAllPointages();
  const nominalMinutes = timeToMinutes(NOMINAL_END) - timeToMinutes(NOMINAL_START);

  const uniqueInterns = new Set(pointages.map((p) => p.email)).size;
  const enCours = pointages.filter((p) => p.heureArrivee && !p.heureDepart).length;
  const aVerifier = pointages.filter((p) => p.flags.length > 0).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">ENSEA</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Tableau de bord — pointage des stagiaires</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Pointages enregistrés" value={pointages.length} />
        <Kpi label="Stagiaires suivis" value={uniqueInterns} />
        <Kpi label="Présents (en cours)" value={enCours} />
        <Kpi label="À vérifier" value={aVerifier} />
      </div>

      <DashboardTable pointages={pointages} nominalMinutes={nominalMinutes} />
    </div>
  );
}
