"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";

interface StageDatesSettingsProps {
  initialDebut: string;
  initialFin: string;
}

export function StageDatesSettings({ initialDebut, initialFin }: StageDatesSettingsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [debut, setDebut] = useState(initialDebut);
  const [fin, setFin] = useState(initialFin);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (debut > fin) {
      setError("La date de début doit être antérieure ou égale à la date de fin.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/dashboard-stage-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debut, fin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="cursor-pointer" onClick={() => setOpen(true)}>
        Dates du stage
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Dates du stage</CardTitle>
        <CardDescription>Définit la période de l&apos;édition en cours (utilisée pour les jours ouvrés, absences, heures attendues).</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="stageDebut">Date de début</Label>
            <Input id="stageDebut" type="date" required value={debut} onChange={(e) => setDebut(e.target.value)} />
          </div>
          <div className="grid gap-2 pb-2">
            <Label htmlFor="stageFin">Date de fin</Label>
            <Input id="stageFin" type="date" required value={fin} onChange={(e) => setFin(e.target.value)} />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertTitle>Dates mises à jour.</AlertTitle>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 pt-10">
          <Button type="submit" className="cursor-pointer" disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button type="button" variant="ghost" className="cursor-pointer" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
