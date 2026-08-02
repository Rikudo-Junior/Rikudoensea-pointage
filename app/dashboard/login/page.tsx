"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AuthShell } from "@/components/AuthShell";
import { RoleTabs } from "@/components/RoleTabs";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Directeur des études"
      description="Vue d'ensemble des stagiaires : présence, retards, absences et heures effectuées."
      personPhoto="/directeur-coulibaly.jpg"
      personName="Romaric Coulibaly"
    >
      <div className="flex flex-col gap-6">
        <div className="text-center lg:hidden">
          <p className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">ENSEA</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Tableau de bord</h1>
        </div>

        <RoleTabs active="directeur" />

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Directeur des études</CardTitle>
            <CardDescription>Accès réservé au directeur des études.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 pb-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="pt-6">
              <Button type="submit" className="w-full cursor-pointer" disabled={busy}>
                {busy ? "Connexion…" : "Se connecter"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthShell>
  );
}
