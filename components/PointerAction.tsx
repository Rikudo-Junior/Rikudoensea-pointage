"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type Step = "idle" | "pointing" | "done";
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

  async function handlePointer(type: PointType) {
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
      if (data.type === "arrivee") {
        setArrivee(data.heure);
      } else {
        setDepart(data.heure);
      }
      setResult(data);
      setStep("done");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
      setStep("idle");
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

  const bothDone = Boolean(arrivee && depart);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pointer</CardTitle>
        <CardDescription>
          {bothDone
            ? "Pointage du jour terminé — à demain !"
            : "Pointez votre arrivée, puis votre départ en fin de journée. Une seule fois chacun par jour."}
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
            onClick={() => handlePointer("depart")}
            disabled={step === "pointing" || !arrivee || Boolean(depart)}
          >
            {depart ? `Départ ✓ ${depart.slice(0, 5)}` : "Pointer départ"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
