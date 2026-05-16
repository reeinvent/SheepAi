declare global {
  interface Window {
    __mapsLoaded?: boolean;
    google?: {
      maps: any;
    };
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

let loadingPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(): Promise<void> {
  // If already loaded, resolve immediately
  if (typeof window !== "undefined" && window.google?.maps) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (loadingPromise) {
    return loadingPromise;
  }

  // Create new loading promise
  loadingPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is not defined"));
      return;
    }

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.__mapsLoaded = true;
      resolve();
    };
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loadingPromise;
}
