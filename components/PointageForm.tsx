"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FlagList } from "@/components/StatusBadge";
import { CLIENT_TEST_MODE } from "@/lib/publicConfig";
import { captureGeolocation } from "@/lib/useGeolocation";
import type { Flag } from "@/lib/timeRules";

type Step = "loading" | "register" | "verify" | "ready" | "pointing" | "done";

interface DoneResult {
  type: "arrivee" | "depart";
  heure: string;
  flags: Flag[];
  dureeMinutes?: number;
}

type TestGeolocChoice = "site" | "hors_site" | "refus";

export function PointageForm() {
  const [step, setStep] = useState<Step>("loading");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DoneResult | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const [testGeoloc, setTestGeoloc] = useState<TestGeolocChoice>("site");
  const [testNow, setTestNow] = useState("");

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data: { loggedIn: boolean; prenom?: string; nom?: string }) => {
        if (data.loggedIn) {
          setDisplayName(`${data.prenom} ${data.nom}`);
          setStep("ready");
        } else {
          setStep("register");
        }
      })
      .catch(() => setStep("register"));
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, nom, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setStep("verify");
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setDisplayName(`${data.prenom} ${data.nom}`);
      setStep("ready");
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePointer() {
    setError(null);
    setStep("pointing");

    let geoloc: { geolocStatus: "ok" | "denied_or_unavailable"; lat?: number; lon?: number };

    if (CLIENT_TEST_MODE) {
      if (testGeoloc === "refus") {
        geoloc = { geolocStatus: "denied_or_unavailable" };
      } else if (testGeoloc === "hors_site") {
        geoloc = { geolocStatus: "ok", lat: 48.8566, lon: 2.3522 }; // Paris centre, hors zone école
      } else {
        geoloc = { geolocStatus: "ok" }; // lat/lon omis: le serveur utilise SCHOOL_LAT/LON en interne côté test si besoin
      }
    } else {
      const outcome = await captureGeolocation();
      geoloc =
        outcome.status === "ok"
          ? { geolocStatus: "ok", lat: outcome.lat, lon: outcome.lon }
          : { geolocStatus: "denied_or_unavailable" };
    }

    try {
      const res = await fetch("/api/pointage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...geoloc,
          ...(CLIENT_TEST_MODE && testNow ? { testNowIso: new Date(testNow).toISOString() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setStep("ready");
        return;
      }
      setResult(data);
      setStep("done");
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
      setStep("ready");
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">ENSEA</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Pointage des stagiaires</h1>
      </div>

      {step === "loading" && (
        <Card className="w-full">
          <CardContent className="py-10 text-center text-muted-foreground">Chargement…</CardContent>
        </Card>
      )}

      {step === "register" && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Première connexion</CardTitle>
            <CardDescription>
              Renseignez votre identité et votre email professionnel ENSEA pour recevoir un code de vérification.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" required value={prenom} onChange={(e) => setPrenom(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" required value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="prenom.nom@ensea.edu.ci"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {busy ? "Envoi en cours…" : "Recevoir mon code"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {step === "verify" && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Code de vérification</CardTitle>
            <CardDescription>Un code à 6 chiffres a été envoyé à {email}.</CardDescription>
          </CardHeader>
          <form onSubmit={handleVerify}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="text-center text-lg tracking-[0.5em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
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
                {busy ? "Vérification…" : "Valider"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {(step === "ready" || step === "pointing") && (
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardDescription>Connecté en tant que</CardDescription>
            <CardTitle className="text-xl">{displayName}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            {CLIENT_TEST_MODE && (
              <div className="w-full rounded-md border border-dashed border-accent/50 bg-accent/5 p-3 text-xs">
                <p className="mb-2 font-semibold text-accent">Mode test</p>
                <div className="mb-2 flex flex-wrap gap-2">
                  {(["site", "hors_site", "refus"] as TestGeolocChoice[]).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setTestGeoloc(choice)}
                      className={`cursor-pointer rounded-full border px-3 py-1 transition-colors ${
                        testGeoloc === choice
                          ? "border-secondary bg-secondary text-secondary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {choice === "site" ? "Sur site" : choice === "hors_site" ? "Hors site" : "Refuser géoloc"}
                    </button>
                  ))}
                </div>
                <Label htmlFor="testNow" className="mb-1">
                  Simuler la date/heure
                </Label>
                <Input
                  id="testNow"
                  type="datetime-local"
                  value={testNow}
                  onChange={(e) => setTestNow(e.target.value)}
                />
              </div>
            )}

            <Button
              size="lg"
              className="h-16 w-full cursor-pointer text-lg font-semibold"
              onClick={handlePointer}
              disabled={step === "pointing"}
            >
              {step === "pointing" ? "Localisation en cours…" : "Pointer"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "done" && result && (
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {result.type === "arrivee" ? "Arrivée enregistrée" : "Départ enregistré"}
            </CardTitle>
            <CardDescription>
              {result.type === "arrivee"
                ? `Arrivée à ${result.heure.slice(0, 5)}`
                : `Départ à ${result.heure.slice(0, 5)}${
                    typeof result.dureeMinutes === "number"
                      ? ` — durée: ${Math.floor(result.dureeMinutes / 60)}h${String(result.dureeMinutes % 60).padStart(2, "0")}`
                      : ""
                  }`}
            </CardDescription>
          </CardHeader>
          {result.flags.length > 0 && (
            <>
              <Separator />
              <CardContent>
                <p className="mb-2 text-xs text-muted-foreground">À vérifier par le responsable :</p>
                <FlagList flags={result.flags} />
              </CardContent>
            </>
          )}
          <CardFooter>
            <Button
              variant="outline"
              className="w-full cursor-pointer"
              onClick={() => {
                setResult(null);
                setStep("ready");
              }}
            >
              Retour
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
