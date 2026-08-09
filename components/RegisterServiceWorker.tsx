"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installable sans service worker fonctionnel n'est pas critique — on n'affiche
        // rien à l'utilisateur si l'enregistrement échoue.
      });
    }
  }, []);

  return null;
}
