"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/logout", { method: "POST" });
    router.replace("/pointage");
    router.refresh();
  }

  return (
    <Button variant="ghost" className="cursor-pointer" onClick={handleLogout} disabled={loggingOut}>
      Déconnexion
    </Button>
  );
}
