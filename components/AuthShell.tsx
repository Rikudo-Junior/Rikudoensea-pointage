import Image from "next/image";
import type { ReactNode } from "react";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ENSEA_SLIDES } from "@/lib/enseaInfo";

interface AuthShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  personPhoto?: string;
  personName?: string;
}

/** Petite carte photo décorative, statique — réservée au bureau (le mobile n'a pas la place). */
function FloatingCard({ image, className }: { image: string; className: string }) {
  return (
    <div
      className={`pointer-events-none absolute hidden overflow-hidden rounded-xl shadow-xl ring-1 ring-white/10 lg:block ${className}`}
    >
      <Image src={image} alt="" fill sizes="220px" className="object-cover" />
    </div>
  );
}

/**
 * Layout pour les pages de connexion (stagiaire / directeur des études).
 * Empilé (bannière compacte en haut, formulaire en dessous) sur mobile ;
 * deux colonnes plein écran à partir de `lg`.
 */
export function AuthShell({
  children,
  title = "Pointage des stagiaires",
  description = "Suivi dynamique des heures d'arrivée, de départ et des absences pour toute la cohorte.",
  personPhoto,
  personName,
}: AuthShellProps) {
  return (
    <div className="flex min-h-svh w-full flex-col lg:flex-row">
      <div className="relative flex w-full flex-col justify-between gap-8 overflow-hidden bg-[#0B1220] p-6 text-white sm:p-10 lg:w-1/2 lg:gap-0 lg:p-12">
        {/* Fond géométrique animé : dégradés radiaux, grille, formes floues qui dérivent. */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(30,64,175,0.4),transparent_50%),radial-gradient(circle_at_85%_0%,rgba(14,165,233,0.28),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.18),transparent_55%)]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="animate-drift-a absolute -top-24 -right-20 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
          <div className="animate-drift-b absolute -bottom-28 -left-16 h-[26rem] w-[26rem] rounded-full bg-secondary/40 blur-3xl" />
        </div>

        {/* Petites cartes flottantes (bureau uniquement) : grille à colonnes/lignes fixes
            (46/64/82% de large, paliers de 12-16% en hauteur) pour garantir qu'aucune ne
            se chevauche, en laissant le coin haut-gauche (texte) et bas-gauche (carrousel)
            libres. */}
        <FloatingCard image="/hero-excellence.jpg" className="top-[6%] left-[46%] h-16 w-24 -rotate-2 opacity-60" />
        <FloatingCard image="/hero-salle-info.jpg" className="top-[6%] left-[64%] h-14 w-20 rotate-2 opacity-55" />
        <FloatingCard image="/hero-abers.jpg" className="top-[6%] left-[82%] h-16 w-24 rotate-2 opacity-70" />

        <FloatingCard image="/hero-laptops.jpg" className="top-[22%] left-[62%] h-20 w-28 rotate-2 opacity-70" />
        <FloatingCard image="/hero-trophee.jpg" className="top-[20%] left-[78%] h-24 w-36 rotate-3 opacity-90" />

        <FloatingCard image="/hero-campus.jpg" className="top-[38%] left-[20%] h-16 w-24 -rotate-3 opacity-60" />
        <FloatingCard image="/hero-concours.jpg" className="top-[38%] left-[46%] h-20 w-28 -rotate-3 opacity-75" />
        <FloatingCard image="/hero-jpal.jpg" className="top-[38%] left-[82%] h-20 w-28 -rotate-2 opacity-80" />

        <FloatingCard image="/hero-ceremonie.jpg" className="top-[50%] left-[4%] h-20 w-28 -rotate-2 opacity-75" />
        <FloatingCard image="/hero-group.jpg" className="top-[50%] left-[46%] h-20 w-28 rotate-3 opacity-70" />
        <FloatingCard image="/hero-doctorat.jpg" className="top-[50%] left-[82%] h-16 w-24 rotate-3 opacity-70" />

        <FloatingCard image="/hero-sensibilisation.jpg" className="top-[62%] left-[46%] h-16 w-24 rotate-6 opacity-70" />
        <FloatingCard image="/hero-event.jpg" className="top-[62%] left-[64%] h-16 w-24 rotate-6 opacity-60" />
        <FloatingCard image="/hero-formation.jpg" className="top-[62%] left-[82%] h-20 w-28 rotate-6 opacity-70" />

        <FloatingCard image="/hero-opendays.jpg" className="top-[78%] left-[64%] h-16 w-24 -rotate-2 opacity-70" />

        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-2 shadow-sm lg:h-16 lg:w-16">
            <Image src="/logo.jpg" alt="ENSEA" width={220} height={120} className="h-full w-full object-contain" priority />
          </div>
          <h2 className="mt-6 max-w-sm text-2xl leading-tight font-bold lg:mt-8 lg:text-3xl">{title}</h2>
          <p className="mt-3 max-w-sm text-sm opacity-80 lg:mt-4">{description}</p>

          {personPhoto && (
            <div className="mt-5 flex items-center gap-3 lg:mt-6">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20 lg:h-12 lg:w-12">
                <Image src={personPhoto} alt={personName ?? ""} width={96} height={96} className="h-full w-full object-cover" />
              </div>
              {personName && <p className="text-sm font-medium opacity-90">{personName}</p>}
            </div>
          )}
        </div>

        <div className="relative max-w-sm">
          <HeroCarousel slides={ENSEA_SLIDES} />
        </div>
      </div>

      <div className="relative flex w-full flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 py-10 lg:w-1/2 lg:py-12">
        <div className="animate-glow-pulse pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="animate-glow-pulse pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-secondary/15 blur-3xl [animation-delay:3s]" />
        <div className="relative w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
