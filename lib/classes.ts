export const CLASSES = ["ISE", "AS"] as const;

export type Classe = (typeof CLASSES)[number];

export function isClasse(value: unknown): value is Classe {
  return typeof value === "string" && (CLASSES as readonly string[]).includes(value);
}
