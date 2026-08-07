import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, MAX_RAPPORT_PDF_BYTES } from "@/lib/config";
import { verifySessionToken } from "@/lib/session";
import { now } from "@/lib/clock";
import { schoolDateString } from "@/lib/schoolTime";

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;
  if (!session) {
    return NextResponse.json({ error: "Session expirée. Merci de vous reconnecter." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Le fichier doit être un PDF." }, { status: 400 });
  }
  if (file.size > MAX_RAPPORT_PDF_BYTES) {
    return NextResponse.json(
      { error: `Le fichier dépasse la taille maximale autorisée (${Math.floor(MAX_RAPPORT_PDF_BYTES / (1024 * 1024))} Mo).` },
      { status: 400 },
    );
  }

  const date = schoolDateString(now());
  const pathname = `rapports/${session.userId}/${date}-${randomUUID()}.pdf`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: "application/pdf",
  });

  return NextResponse.json({ url: blob.url, filename: file.name });
}
