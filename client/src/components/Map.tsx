/**
 * Leaflet Map Integration for TNFD Priority Map
 * - CartoDB Dark Matter tiles (no API key required)
 * - Drop-in replacement for Google Maps version
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import L from "leaflet";

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: L.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: true,
    });

    // CartoDB Dark Matter tiles - dark theme, free, no API key
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map.current);

    // Force correct layout measurement after DOM is ready
    // This fixes marker displacement issues when the container
    // size isn't fully resolved at initialization time.
    const m = map.current;
    requestAnimationFrame(() => {
      m.invalidateSize();
    });

    if (onMapReady) {
      onMapReady(map.current);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={mapContainer} className={cn("w-full h-full", className)} />
  );
}
