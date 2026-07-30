// Seules les valeurs préfixées NEXT_PUBLIC_ sont sûres à importer dans un composant client
// (lib/config.ts contient des identifiants serveur et ne doit jamais être importé côté client).
export const CLIENT_TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";
