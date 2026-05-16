"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { loadGoogleMapsScript } from "@/app/lib/googleMapsLoader";

interface LatLng {
  lat: number;
  lng: number;
}

interface LocationPickerModalProps {
  open: boolean;
  onDismiss: () => void;
  onSkip: () => void;
  onConfirm: (coords: LatLng, address: string) => void;
}

declare global {
  interface Window {
    __mapsLoaded?: boolean;
    google?: {
      maps: any;
    };
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

const DEFAULT_CENTER: LatLng = { lat: 43.5081, lng: 16.4402 };

export function LocationPickerModal({
  open,
  onDismiss,
  onSkip,
  onConfirm,
}: LocationPickerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [address, setAddress] = useState<string>("");
  const [geocoding, setGeocoding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPin(null);
    setAddress("");
    setLoading(true);
    setError(false);

    loadGoogleMapsScript()
      .then(() => setLoading(false))
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  }, [open]);

  useEffect(() => {
    if (loading || error || !open || !mapRef.current) return;

    const map = new window.google!.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      mapId: MAP_ID,
    });

    mapInstanceRef.current = map;

    const geocoder = new window.google!.maps.Geocoder();

    map.addListener("click", (e: any) => {
      if (!e.latLng) return;
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };

      if (markerRef.current) {
        markerRef.current.position = e.latLng;
      } else {
        markerRef.current = new window.google!.maps.marker.AdvancedMarkerElement(
          {
            position: e.latLng,
            map,
          },
        );
      }

      setPin(coords);
      setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      setGeocoding(true);

      geocoder.geocode(
        { location: e.latLng },
        (results: any[] | null) => {
          if (results?.[0]) setAddress(results[0].formatted_address);
          setGeocoding(false);
        },
      );
    });

    return () => {
      if (markerRef.current) markerRef.current.map = null;
      markerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, [loading, error, open]);

  const handleConfirm = () => {
    if (pin) onConfirm(pin, address);
  };

  const footer = (
    <>
      <Button variant="outline" className="flex-1" onClick={onSkip}>
        Preskoči
      </Button>
      <Button
        variant="primary"
        className="flex-1"
        onClick={handleConfirm}
        disabled={!pin || geocoding}
      >
        <Icon name="map-pin" size={16} />
        Dodaj lokaciju
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onDismiss}
      title="Označi lokaciju"
      subtitle="Nije obavezno — kliknite bilo gdje na karti za odabir lokacije"
      size="lg"
      footer={footer}
    >
      <div className="space-y-3">
        <div
          ref={mapRef}
          className="w-full rounded-xl overflow-hidden bg-slate-100"
          style={{ height: 360 }}
        >
          {loading && (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Učitavanje karte…
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full text-red-500 text-sm">
              Učitavanje karte nije uspjelo. Možete preskočiti ovaj korak.
            </div>
          )}
        </div>

        {pin ? (
          <p className="text-sm text-slate-600 flex items-center gap-1.5 truncate">
            <Icon
              name="map-pin"
              size={14}
              className="shrink-0 text-emerald-600"
            />
            <span className="truncate">
              {geocoding ? "Dohvaćanje adrese…" : address}
            </span>
          </p>
        ) : (
          <p className="text-sm text-slate-400 flex items-center gap-1.5">
            <Icon name="map-pin" size={14} />
            Još nije odabrana lokacija
          </p>
        )}
      </div>
    </Modal>
  );
}
