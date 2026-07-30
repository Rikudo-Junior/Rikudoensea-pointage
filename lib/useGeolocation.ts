export type GeolocationOutcome =
  | { status: "ok"; lat: number; lon: number }
  | { status: "denied_or_unavailable" };

/**
 * Capture ponctuelle de la position via l'API navigateur native — pas de dépendance tierce.
 * Ne rejette jamais : un refus, une absence de support, ou un timeout retombent tous sur
 * "denied_or_unavailable", laissant l'appelant enregistrer le pointage avec le flag sans_geoloc
 * plutôt que de bloquer l'utilisateur.
 */
export function captureGeolocation(timeoutMs = 8000): Promise<GeolocationOutcome> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ status: "denied_or_unavailable" });
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ status: "denied_or_unavailable" });
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({
          status: "ok",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ status: "denied_or_unavailable" });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}
