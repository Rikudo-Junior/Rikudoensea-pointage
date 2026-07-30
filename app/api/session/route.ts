import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config";
import { verifySessionToken } from "@/lib/session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = cookie ? await verifySessionToken(cookie) : null;
  if (!session) {
    return NextResponse.json({ loggedIn: false });
  }
  return NextResponse.json({ loggedIn: true, prenom: session.prenom, nom: session.nom });
}
