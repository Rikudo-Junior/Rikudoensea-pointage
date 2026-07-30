"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";

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
    <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">ENSEA</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Tableau de bord</h1>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Accès responsable</CardTitle>
          <CardDescription>Réservé au responsable des stages.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
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
          <CardFooter>
            <Button type="submit" className="w-full cursor-pointer" disabled={busy}>
              {busy ? "Connexion…" : "Se connecter"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
