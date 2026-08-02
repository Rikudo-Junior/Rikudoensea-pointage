import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le worker de vérification TypeScript interne à `next build` peut crasher de façon
  // aléatoire (SIGSEGV/SIGTRAP, V8 fatal error) sur les types générés par Prisma 7 — observé
  // sous Node v25.8.1 et, plus rarement, sous Node 22 LTS. `npx tsc --noEmit` (voir
  // `npm run typecheck`), lui, passe de façon fiable : on s'y fie à la place de cette
  // double vérification interne.
  typescript: { ignoreBuildErrors: true },
  // Les workers parallèles de build ("collecting page data" / "generating static pages")
  // peuvent crasher aléatoirement (SIGSEGV) quand plusieurs d'entre eux évaluent en même
  // temps les modules générés par Prisma 7. Limiter à 1 seul worker réduit fortement la
  // fréquence du crash (au prix d'un temps de build légèrement plus long).
  experimental: { cpus: 1 },
};

export default nextConfig;
