"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FlagList } from "@/components/StatusBadge";
import { CLIENT_TEST_MODE } from "@/lib/publicConfig";
import { captureGeolocation } from "@/lib/useGeolocation";
import type { Flag } from "@/lib/timeRules";

const MAX_RAPPORT_PDF_BYTES = 8 * 1024 * 1024; // 8 Mo — doit rester aligné avec lib/config.ts

type Step = "idle" | "pointing" | "rapport" | "done";
type TestGeolocChoice = "site" | "hors_site" | "refus";
type PointType = "arrivee" | "depart";

interface DoneResult {
  type: PointType;
  heure: string;
  flags: Flag[];
  dureeMinutes?: number;
}

interface PointerActionProps {
  initialArrivee?: string | null;
  initialDepart?: string | null;
}

export function PointerAction({ initialArrivee = null, initialDepart = null }: PointerActionProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [arrivee, setArrivee] = useState<string | null>(initialArrivee);
  const [depart, setDepart] = useState<string | null>(initialDepart);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DoneResult | null>(null);
  const [testGeoloc, setTestGeoloc] = useState<TestGeolocChoice>("site");
  const [testNow, setTestNow] = useState("");
  const [rapportTexte, setRapportTexte] = useState("");
  const [rapportFile, setRapportFile] = useState<File | null>(null);
  const [rapportBusy, setRapportBusy] = useState(false);

  async function resolveGeoloc(): Promise<{ geolocStatus: "ok" | "denied_or_unavailable"; lat?: number; lon?: number }> {
    if (CLIENT_TEST_MODE) {
      if (testGeoloc === "refus") {
        return { geolocStatus: "denied_or_unavailable" };
      }
      if (testGeoloc === "hors_site") {
        return { geolocStatus: "ok", lat: 48.8566, lon: 2.3522 }; // Paris centre, hors zone école
      }
      return { geolocStatus: "ok" }; // lat/lon omis: le serveur utilise SCHOOL_LAT/LON en interne côté test si besoin
    }
    const outcome = await captureGeolocation();
    return outcome.status === "ok"
      ? { geolocStatus: "ok", lat: outcome.lat, lon: outcome.lon }
      : { geolocStatus: "denied_or_unavailable" };
  }

  async function handlePointer(type: "arrivee") {
    setError(null);
    setStep("pointing");
    const geoloc = await resolveGeoloc();

    try {
      const res = await fetch("/api/pointage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...geoloc,
          ...(CLIENT_TEST_MODE && testNow ? { testNowIso: new Date(testNow).toISOString() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setStep("idle");
        return;
      }
      setArrivee(data.heure);
      setResult(data);
      setStep("done");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
      setStep("idle");
    }
  }

  function handleRapportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_RAPPORT_PDF_BYTES) {
      setError(`Le fichier dépasse la taille maximale autorisée (${Math.floor(MAX_RAPPORT_PDF_BYTES / (1024 * 1024))} Mo).`);
      e.target.value = "";
      setRapportFile(null);
      return;
    }
    setError(null);
    setRapportFile(file);
  }

  async function handleSubmitRapport(e: React.FormEvent) {
    e.preventDefault();
    const texte = rapportTexte.trim();
    if (!texte) {
      setError("Merci de décrire ce que vous avez fait aujourd'hui.");
      return;
    }
    setError(null);
    setRapportBusy(true);
    try {
      const geoloc = await resolveGeoloc();

      let rapportPdfUrl: string | null = null;
      let rapportPdfNom: string | null = null;
      if (rapportFile) {
        const formData = new FormData();
        formData.append("file", rapportFile);
        const uploadRes = await fetch("/api/rapport-upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Impossible d'envoyer le PDF.");
          return;
        }
        rapportPdfUrl = uploadData.url;
        rapportPdfNom = uploadData.filename;
      }

      const res = await fetch("/api/pointage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "depart",
          ...geoloc,
          rapportTexte: texte,
          rapportPdfUrl,
          rapportPdfNom,
          ...(CLIENT_TEST_MODE && testNow ? { testNowIso: new Date(testNow).toISOString() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setDepart(data.heure);
      setResult(data);
      setStep("done");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setRapportBusy(false);
    }
  }

  if (step === "done" && result) {
    return (
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
              <p className="mb-2 text-xs text-muted-foreground">À vérifier par le directeur des études :</p>
              <FlagList flags={result.flags} />
            </CardContent>
          </>
        )}
        <CardFooter className="pt-6">
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            onClick={() => {
              setResult(null);
              setStep("idle");
            }}
          >
            Fermer
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "rapport") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Rapport de fin de journée</CardTitle>
          <CardDescription>
            Décrivez ce que vous avez fait aujourd&apos;hui avant de pointer votre départ. Vous pouvez aussi joindre un
            PDF de vos travaux.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitRapport}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rapportTexte">Qu&apos;avez-vous fait aujourd&apos;hui ?</Label>
              <Textarea
                id="rapportTexte"
                required
                rows={5}
                value={rapportTexte}
                onChange={(e) => setRapportTexte(e.target.value)}
                placeholder="Décrivez brièvement vos tâches, avancées, difficultés rencontrées…"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rapportFile">Travaux réalisés (PDF, optionnel)</Label>
              <Input id="rapportFile" type="file" accept="application/pdf" onChange={handleRapportFileChange} />
              {rapportFile && <p className="text-xs text-muted-foreground">{rapportFile.name}</p>}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button type="submit" className="w-full cursor-pointer" disabled={rapportBusy}>
              {rapportBusy ? "Envoi en cours…" : "Valider et pointer mon départ"}
            </Button>
            <button
              type="button"
              className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setError(null);
                setStep("idle");
              }}
              disabled={rapportBusy}
            >
              Annuler
            </button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  const bothDone = Boolean(arrivee && depart);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pointer</CardTitle>
        <CardDescription>
          {bothDone
            ? "Pointage du jour terminé — à demain !"
            : "Pointez votre arrivée, puis votre départ en fin de journée (un résumé de votre journée vous sera demandé). Une seule fois chacun par jour."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
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
            <Input id="testNow" type="datetime-local" value={testNow} onChange={(e) => setTestNow(e.target.value)} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-14 cursor-pointer text-base font-semibold"
            onClick={() => handlePointer("arrivee")}
            disabled={step === "pointing" || Boolean(arrivee)}
          >
            {arrivee ? `Arrivée ✓ ${arrivee.slice(0, 5)}` : "Pointer arrivée"}
          </Button>
          <Button
            size="lg"
            variant={depart ? "outline" : "default"}
            className="h-14 cursor-pointer text-base font-semibold"
            onClick={() => {
              setError(null);
              setStep("rapport");
            }}
            disabled={step === "pointing" || !arrivee || Boolean(depart)}
          >
            {depart ? `Départ ✓ ${depart.slice(0, 5)}` : "Pointer départ"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
