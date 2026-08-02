"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AuthShell } from "@/components/AuthShell";
import { RoleTabs } from "@/components/RoleTabs";
import { CLASSES, type Classe } from "@/lib/classes";

type Step = "loading" | "register" | "verify" | "login";

export function PointageForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [classe, setClasse] = useState<Classe | null>(null);
  const [loginPassword, setLoginPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data: { loggedIn: boolean }) => {
        if (data.loggedIn) {
          router.replace("/mon-suivi");
        } else {
          setStep("register");
        }
      })
      .catch(() => setStep("register"));
  }, [router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!classe) {
      setError("Merci de sélectionner votre classe.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, nom, email, password, classe }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "ALREADY_REGISTERED") {
          setError(null);
          setLoginPassword("");
          setStep("login");
          return;
        }
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      router.push("/mon-suivi");
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
      router.push("/mon-suivi");
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <RoleTabs active="stagiaire" />

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
                Renseignez votre identité et votre email institutionnel ENSEA pour recevoir un code de vérification.
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
                  <Label htmlFor="email">Email institutionnel</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="prenom.nom@ensea.edu.ci"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 pb-2">
                  <Label>Classe</Label>
                  <div className="flex gap-2">
                    {CLASSES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setClasse(c)}
                        className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                          classe === c
                            ? "border-secondary bg-secondary text-secondary-foreground"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-6">
                <Button type="submit" className="w-full cursor-pointer" disabled={busy}>
                  {busy ? "Envoi en cours…" : "Recevoir mon code"}
                </Button>
                <button
                  type="button"
                  className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => {
                    setError(null);
                    setStep("login");
                  }}
                >
                  Déjà inscrit ? Se connecter
                </button>
              </CardFooter>
            </form>
          </Card>
        )}

        {step === "login" && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>Connectez-vous avec votre email ENSEA et votre mot de passe.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="loginEmail">Email institutionnel</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    required
                    placeholder="prenom.nom@ensea.edu.ci"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 pb-2">
                  <Label htmlFor="loginPassword">Mot de passe</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-6">
                <Button type="submit" className="w-full cursor-pointer" disabled={busy}>
                  {busy ? "Connexion en cours…" : "Se connecter"}
                </Button>
                <button
                  type="button"
                  className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => {
                    setError(null);
                    setStep("register");
                  }}
                >
                  Pas encore de compte ? S&apos;inscrire
                </button>
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
              <CardFooter className="pt-6">
                <Button type="submit" className="w-full cursor-pointer" disabled={busy}>
                  {busy ? "Vérification…" : "Valider"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </AuthShell>
  );
}
