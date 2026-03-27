/**
 * Leaflet Map Integration for TNFD Priority Map
 * - Google Maps-style light tiles (no API key required)
 * - Canvas renderer to prevent marker displacement from CSS conflicts
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
      // CRITICAL: Use Canvas renderer instead of SVG.
      // This renders circle markers and rectangles directly to a
      // <canvas> element, making them immune to CSS conflicts
      // (Tailwind box-sizing, transitions, etc.) that cause
      // marker displacement in the default SVG renderer.
      preferCanvas: true,
    });

    // OpenStreetMap standard tiles - Google Maps-like light theme
    // with full Japanese labels, terrain, and geography details.
    L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(map.current);

    // Force correct layout measurement after DOM is ready
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
    <div
      ref={mapContainer}
      className={cn("w-full h-full", className)}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
