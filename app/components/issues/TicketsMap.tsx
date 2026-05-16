"use client";

import { useEffect, useRef } from "react";
import { TicketObject } from "@/app/lib/issues/types";
import { loadGoogleMapsScript } from "@/app/lib/googleMapsLoader";
import "./TicketsMap.css";

interface TicketsMapProps {
  tickets: TicketObject[];
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "#f59e0b", // amber
  open: "#3b82f6", // blue
  in_progress: "#8b5cf6", // purple
  resolved: "#10b981", // emerald
  rejected: "#ef4444", // red
};

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "Na čekanju",
  open: "Otvoreno",
  in_progress: "U tijeku",
  resolved: "Riješeno",
  rejected: "Odbijeno",
};

export function TicketsMap({ tickets }: TicketsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  useEffect(() => {
    console.log("TicketsMap mounted, tickets:", tickets.length);
    if (!mapRef.current || !GOOGLE_MAPS_API_KEY) {
      console.log("Missing mapRef or API key");
      return;
    }

    const initMap = async () => {
      try {
        console.log("Initializing map...");
        await loadGoogleMapsScript();

        if (!mapRef.current) {
          console.log("mapRef.current is null after loading script");
          return;
        }

        // Filter tickets with coordinates
        const ticketsWithCoords = tickets.filter((t) => t.metadata?.lat && t.metadata?.lng);
        console.log("Tickets with coords:", ticketsWithCoords.length);

        if (ticketsWithCoords.length === 0) {
          console.log("No tickets with coordinates, showing default center");
          // Default center if no tickets with coords
          mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
            zoom: 12,
            center: { lat: 43.5081, lng: 16.4402 }, // Split, Croatia
          });
          return;
        }

        // Create bounds to fit all markers
        const bounds = new (window as any).google.maps.LatLngBounds();

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        // Initialize map with first ticket's location
        mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
          zoom: 12,
          center: {
            lat: ticketsWithCoords[0].metadata!.lat!,
            lng: ticketsWithCoords[0].metadata!.lng!,
          },
        });

        // Create markers for each ticket
        ticketsWithCoords.forEach((ticket) => {
          const lat = ticket.metadata?.lat;
          const lng = ticket.metadata?.lng;

          if (!lat || !lng) return;

          const marker = new (window as any).google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: ticket.title,
            icon: {
              path: "M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20s12-12.8 12-20c0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z",
              fillColor: STATUS_COLORS[ticket.status] || "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
              scale: 1.8,
              anchor: new (window as any).google.maps.Point(12, 20),
            },
          });

          // Add click listener to show info window
          marker.addListener("click", () => {
            if (infoWindowRef.current) {
              infoWindowRef.current.close();
            }

            const content = `
              <div class="p-3 max-w-xs">
                <h3 class="font-semibold text-sm mb-1">${ticket.title}</h3>
                <p class="text-xs text-gray-600 mb-2">${ticket.body || "Nema opisa"}</p>
                <div class="flex items-center gap-2 mb-2">
                  <span class="inline-block w-2 h-2 rounded-full" style="background-color: ${STATUS_COLORS[ticket.status]}"></span>
                  <span class="text-xs font-medium">${STATUS_LABELS[ticket.status]}</span>
                </div>
                ${ticket.metadata?.location ? `<p class="text-xs text-gray-500">${ticket.metadata.location}</p>` : ""}
              </div>
            `;

            infoWindowRef.current = new (window as any).google.maps.InfoWindow({
              content,
            });

            infoWindowRef.current.open(mapInstanceRef.current, marker);
          });

          markersRef.current.push(marker);
          bounds.extend({ lat, lng });
        });

        // Fit map to bounds
        if (ticketsWithCoords.length > 1) {
          mapInstanceRef.current.fitBounds(bounds);
        }
        console.log("Map initialized successfully");
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initMap();

    return () => {
      // Cleanup
      markersRef.current.forEach((marker) => marker.setMap(null));
      infoWindowRef.current?.close();
    };
  }, [tickets]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-500">Google Maps API key not configured</p>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}
