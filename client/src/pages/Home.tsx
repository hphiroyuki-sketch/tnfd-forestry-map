/**
 * TNFD優先地域マップ + 日本林業会社エリアマップ + 重ね合わせ分析
 * Design: ミッドナイトブルーのダーク背景、フルスクリーン地図
 * 林業: 市町村バウンディングボックスでエリア表示（密度で色分け）
 * 重ね合わせ: TNFD優先地域マーカーと林業エリアの重なりをハイライト
 *
 * Leaflet.js version - no API key required
 */
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import L from "leaflet";
import { MapView } from "@/components/Map";
import { companyData, allMarkers, TOTAL_COMPANIES, TOTAL_LOCATIONS, type CompanyData, type MarkerData } from "@/data/companyLocations";
import { forestryData, type ForestryEntry } from "@/data/forestryData";
import { CompanyPanel } from "@/components/CompanyPanel";
import { CompanyList } from "@/components/CompanyList";
import { ForestryPanel } from "@/components/ForestryPanel";
import { ForestryList } from "@/components/ForestryList";
import { StatsBar } from "@/components/StatsBar";
import { MapLegend } from "@/components/MapLegend";
import { Search, List, X, Globe2, TreePine, Building2, Layers, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FORESTRY_BBOX_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663183954967/WTQ7sRHAqdULfwpZFNGajP/forestry_areas_bbox_3de0f10c.json";

type LayerMode = "tnfd" | "forestry" | "overlay";
type CategoryFilter = "all" | "直接操業" | "バリューチェーン" | "両方";
type ForestryTypeFilter = "all" | "民間" | "森林組合" | "大手";

interface ForestryArea {
  c: string; // code
  p: string; // prefecture
  m: string; // municipality name
  b: { sw: [number, number]; ne: [number, number] }; // bbox
  cnt: number; // company count
  cos: { n: string; t: string; a: string; u: string }[]; // companies
}

// Color scale for forestry area density
function areaFillColor(count: number, maxCount: number, isOverlap: boolean): string {
  if (isOverlap) {
    const ratio = Math.min(count / maxCount, 1);
    const alpha = 0.35 + ratio * 0.45;
    return `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
  }
  const ratio = Math.min(count / maxCount, 1);
  const alpha = 0.25 + ratio * 0.50;
  return `rgba(34, 197, 94, ${alpha.toFixed(2)})`;
}

function areaBorderColor(count: number, maxCount: number, isOverlap: boolean): string {
  if (isOverlap) {
    const ratio = Math.min(count / maxCount, 1);
    const alpha = 0.6 + ratio * 0.4;
    return `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
  }
  const ratio = Math.min(count / maxCount, 1);
  const alpha = 0.4 + ratio * 0.50;
  return `rgba(34, 197, 94, ${alpha.toFixed(2)})`;
}

// Check if a TNFD marker falls within a bbox
function isInBbox(lat: number, lng: number, bbox: { sw: [number, number]; ne: [number, number] }): boolean {
  return lat >= bbox.sw[0] && lat <= bbox.ne[0] && lng >= bbox.sw[1] && lng <= bbox.ne[1];
}

export default function Home() {
  const mapRef = useRef<L.Map | null>(null);
  const tnfdLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const forestryLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const areaLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const overlapLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const tnfdMarkersRef = useRef<L.CircleMarker[]>([]);
  const forestryMarkersRef = useRef<L.CircleMarker[]>([]);
  const areaRectanglesRef = useRef<L.Rectangle[]>([]);
  const overlapHighlightsRef = useRef<L.Rectangle[]>([]);
  const mapReadyRef = useRef(false);
  const areasLoadedRef = useRef(false);
  const forestryAreasRef = useRef<ForestryArea[]>([]);

  const [layerMode, setLayerMode] = useState<LayerMode>("tnfd");
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null);
  const [selectedForestry, setSelectedForestry] = useState<ForestryEntry | null>(null);
  const [selectedArea, setSelectedArea] = useState<ForestryArea | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [forestryTypeFilter, setForestryTypeFilter] = useState<ForestryTypeFilter>("all");
  const [showAreas, setShowAreas] = useState(true);
  const [areasLoaded, setAreasLoaded] = useState(false);

  // TNFD filtered companies
  const filteredCompanies = useMemo(() => {
    return companyData.filter((c) => {
      const matchesSearch =
        searchQuery === "" ||
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.locations.some((loc) => loc.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        categoryFilter === "all" ||
        c.locations.some((loc) => loc.category === categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  // Forestry filtered entries
  const filteredForestry = useMemo(() => {
    return forestryData.filter((f) => {
      const matchesSearch =
        searchQuery === "" ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.prefecture.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = forestryTypeFilter === "all" || f.type === forestryTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, forestryTypeFilter]);

  // Forestry stats
  const forestryStats = useMemo(() => {
    const minkan = forestryData.filter((f) => f.type === "民間").length;
    const kumiai = forestryData.filter((f) => f.type === "森林組合").length;
    const oote = forestryData.filter((f) => f.type === "大手").length;
    const prefs = new Set(forestryData.map((f) => f.prefecture)).size;
    return { total: forestryData.length, minkan, kumiai, oote, prefs };
  }, []);

  // TNFD stats
  const tnfdStats = useMemo(() => {
    const direct = allMarkers.filter((m) => m.category === "直接操業").length;
    const vc = allMarkers.filter((m) => m.category === "バリューチェーン").length;
    const both = allMarkers.filter((m) => m.category === "両方").length;
    return { totalCompanies: TOTAL_COMPANIES, totalLocations: TOTAL_LOCATIONS, direct, vc, both };
  }, []);

  // Overlay stats
  const overlayStats = useMemo(() => {
    const tnfdInJapan = allMarkers.filter(
      (m) => m.latitude >= 24 && m.latitude <= 46 && m.longitude >= 122 && m.longitude <= 154
    );
    let overlapCount = 0;
    if (forestryAreasRef.current.length > 0) {
      forestryAreasRef.current.forEach((area) => {
        const hasOverlap = tnfdInJapan.some((m) => isInBbox(m.latitude, m.longitude, area.b));
        if (hasOverlap) overlapCount++;
      });
    }
    return {
      tnfdTotal: TOTAL_LOCATIONS,
      forestryTotal: forestryData.length,
      tnfdInJapan: tnfdInJapan.length,
      forestryAreas: forestryAreasRef.current.length,
      overlapAreas: overlapCount,
    };
  }, [areasLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Color helpers
  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case "直接操業": return { bg: "#F59E0B", glow: "rgba(245, 158, 11, 0.5)" };
      case "バリューチェーン": return { bg: "#06B6D4", glow: "rgba(6, 182, 212, 0.5)" };
      case "両方": return { bg: "#10B981", glow: "rgba(16, 185, 129, 0.5)" };
      default: return { bg: "#8B5CF6", glow: "rgba(139, 92, 246, 0.5)" };
    }
  }, []);

  const getForestryColor = useCallback((type: string) => {
    switch (type) {
      case "民間": return { bg: "#22C55E", glow: "rgba(34, 197, 94, 0.5)" };
      case "森林組合": return { bg: "#3B82F6", glow: "rgba(59, 130, 246, 0.5)" };
      case "大手": return { bg: "#EF4444", glow: "rgba(239, 68, 68, 0.5)" };
      default: return { bg: "#A855F7", glow: "rgba(168, 85, 247, 0.5)" };
    }
  }, []);

  // Load forestry area bounding boxes and create rectangles
  const loadForestryAreas = useCallback(
    async (map: L.Map) => {
      if (areasLoadedRef.current) return;
      try {
        const resp = await fetch(FORESTRY_BBOX_URL);
        const data = await resp.json();
        const areas: ForestryArea[] = data.areas;
        forestryAreasRef.current = areas;
        const maxCount = Math.max(...areas.map((a) => a.cnt));

        // TNFD markers in Japan for overlap detection
        const tnfdInJapan = allMarkers.filter(
          (m) => m.latitude >= 24 && m.latitude <= 46 && m.longitude >= 122 && m.longitude <= 154
        );

        areas.forEach((area) => {
          const overlappingTnfd = tnfdInJapan.filter((m) => isInBbox(m.latitude, m.longitude, area.b));
          const hasOverlap = overlappingTnfd.length > 0;

          // Create rectangle for forestry mode (green)
          const bounds: L.LatLngBoundsExpression = [
            [area.b.sw[0], area.b.sw[1]],
            [area.b.ne[0], area.b.ne[1]],
          ];

          const rect = L.rectangle(bounds, {
            color: areaBorderColor(area.cnt, maxCount, false),
            weight: 1,
            fillColor: areaFillColor(area.cnt, maxCount, false),
            fillOpacity: 1,
            interactive: true,
          });

          rect.on("click", () => {
            setSelectedArea(area);
            setSelectedForestry(null);
            setSelectedCompany(null);

            const center = L.latLng(
              (area.b.sw[0] + area.b.ne[0]) / 2,
              (area.b.sw[1] + area.b.ne[1]) / 2
            );

            const companiesList = area.cos
              .map((c) => `<div style="margin:2px 0;font-size:11px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:4px;background:${c.t === '民間' ? '#22C55E' : c.t === '森林組合' ? '#3B82F6' : '#EF4444'};"></span>${c.n} <span style="color:#888;">(${c.t})</span></div>`)
              .join("");

            const overlappingInfo = hasOverlap
              ? `<div style="margin-top:8px;padding-top:6px;border-top:1px solid #333;">
                  <div style="color:#EF4444;font-weight:bold;font-size:11px;margin-bottom:4px;">⚠ TNFD優先地域と重複</div>
                  ${overlappingTnfd.map((m) => `<div style="font-size:10px;color:#F59E0B;">● ${m.companyName} - ${m.locationName}</div>`).join("")}
                </div>`
              : "";

            L.popup({ className: "dark-popup", maxWidth: 320, maxHeight: 300 })
              .setLatLng(center)
              .setContent(`<div style="font-family:'Noto Sans JP',sans-serif;padding:6px;">
                <div style="font-size:14px;font-weight:bold;margin-bottom:4px;">${area.p} ${area.m}</div>
                <div style="color:#888;font-size:11px;margin-bottom:6px;">林業事業者: <strong style="color:#22C55E;">${area.cnt}</strong>社</div>
                <div style="max-height:150px;overflow-y:auto;">${companiesList}</div>
                ${overlappingInfo}
              </div>`)
              .openOn(map);
          });

          areaRectanglesRef.current.push(rect);
          areaLayerGroupRef.current.addLayer(rect);

          // Create overlap highlight rectangle (red, only for overlay mode)
          if (hasOverlap) {
            const overlapRect = L.rectangle(bounds, {
              color: "rgba(239, 68, 68, 0.8)",
              weight: 2,
              fillColor: areaFillColor(area.cnt, maxCount, true),
              fillOpacity: 1,
              interactive: true,
            });

            overlapRect.on("click", () => {
              setSelectedArea(area);
              setSelectedForestry(null);
              setSelectedCompany(null);

              const center = L.latLng(
                (area.b.sw[0] + area.b.ne[0]) / 2,
                (area.b.sw[1] + area.b.ne[1]) / 2
              );

              const companiesList = area.cos
                .map((c) => `<div style="margin:2px 0;font-size:11px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:4px;background:${c.t === '民間' ? '#22C55E' : c.t === '森林組合' ? '#3B82F6' : '#EF4444'};"></span>${c.n} <span style="color:#888;">(${c.t})</span></div>`)
                .join("");

              L.popup({ className: "dark-popup", maxWidth: 320, maxHeight: 350 })
                .setLatLng(center)
                .setContent(`<div style="font-family:'Noto Sans JP',sans-serif;padding:6px;">
                  <div style="font-size:14px;font-weight:bold;margin-bottom:2px;">${area.p} ${area.m}</div>
                  <div style="color:#EF4444;font-weight:bold;font-size:12px;margin-bottom:6px;">⚠ TNFD優先地域との重複エリア</div>
                  <div style="color:#888;font-size:11px;margin-bottom:6px;">林業事業者: <strong style="color:#22C55E;">${area.cnt}</strong>社</div>
                  <div style="margin-bottom:8px;max-height:100px;overflow-y:auto;">${companiesList}</div>
                  <div style="padding-top:6px;border-top:1px solid #333;">
                    <div style="color:#F59E0B;font-weight:bold;font-size:11px;margin-bottom:4px;">TNFD優先地域</div>
                    ${overlappingTnfd.map((m) => `<div style="font-size:10px;color:#F59E0B;">● ${m.companyName} - ${m.locationName}</div>`).join("")}
                  </div>
                </div>`)
                .openOn(map);
            });

            overlapHighlightsRef.current.push(overlapRect);
            overlapLayerGroupRef.current.addLayer(overlapRect);
          }
        });

        areasLoadedRef.current = true;
        setAreasLoaded(true);
      } catch (err) {
        console.error("Failed to load forestry areas:", err);
      }
    },
    []
  );

  // Map ready handler
  const handleMapReady = useCallback(
    (map: L.Map) => {
      mapRef.current = map;
      mapReadyRef.current = true;

      // Create TNFD markers
      allMarkers.forEach((marker) => {
        const colors = getCategoryColor(marker.category);
        const circleMarker = L.circleMarker([marker.latitude, marker.longitude], {
          radius: 5,
          fillColor: colors.bg,
          color: "rgba(255,255,255,0.6)",
          weight: 1.5,
          fillOpacity: 1,
          className: "tnfd-marker",
        });
        circleMarker.bindTooltip(`${marker.companyName} - ${marker.locationName}`, {
          className: "dark-tooltip",
        });
        circleMarker.on("click", () => {
          const company = companyData.find((c) => c.companyName === marker.companyName);
          if (company) {
            setSelectedCompany(company);
            setSelectedMarkerId(marker.id);
            setSelectedForestry(null);
            setSelectedArea(null);
            map.closePopup();
            map.setView([marker.latitude, marker.longitude], 6, { animate: true });
            // Highlight selected company markers
            tnfdMarkersRef.current.forEach((m, idx) => {
              const md = allMarkers[idx];
              if (md.companyName === marker.companyName) {
                m.setRadius(9);
                m.setStyle({ weight: 2, color: "rgba(255,255,255,0.9)" });
              } else {
                m.setRadius(5);
                m.setStyle({ weight: 1.5, color: "rgba(255,255,255,0.6)" });
              }
            });
          }
        });
        tnfdMarkersRef.current.push(circleMarker);
        tnfdLayerGroupRef.current.addLayer(circleMarker);
      });

      // Create Forestry point markers (initially hidden, used at high zoom)
      forestryData.forEach((entry) => {
        const colors = getForestryColor(entry.type);
        const circleMarker = L.circleMarker([entry.latitude, entry.longitude], {
          radius: 3,
          fillColor: colors.bg,
          color: "rgba(255,255,255,0.4)",
          weight: 1,
          fillOpacity: 1,
        });
        circleMarker.bindTooltip(`${entry.name} - ${entry.area}`, {
          className: "dark-tooltip",
        });
        circleMarker.on("click", () => {
          setSelectedForestry(entry);
          setSelectedCompany(null);
          setSelectedMarkerId(null);
          setSelectedArea(null);
          map.closePopup();
          map.setView([entry.latitude, entry.longitude], 10, { animate: true });
        });
        forestryMarkersRef.current.push(circleMarker);
        forestryLayerGroupRef.current.addLayer(circleMarker);
      });

      // Add TNFD layer by default
      tnfdLayerGroupRef.current.addTo(map);

      // Load forestry area bounding boxes
      loadForestryAreas(map);
    },
    [getCategoryColor, getForestryColor, loadForestryAreas]
  );

  // Toggle layer visibility when mode changes
  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return;
    const map = mapRef.current;
    map.closePopup();

    // Remove all layer groups first
    tnfdLayerGroupRef.current.removeFrom(map);
    forestryLayerGroupRef.current.removeFrom(map);
    areaLayerGroupRef.current.removeFrom(map);
    overlapLayerGroupRef.current.removeFrom(map);

    // Remove any existing zoom listener
    map.off("zoomend");

    if (layerMode === "tnfd") {
      tnfdLayerGroupRef.current.addTo(map);
      map.setView([20, 100], 3, { animate: true });
    } else if (layerMode === "forestry") {
      if (showAreas) {
        areaLayerGroupRef.current.addTo(map);
      }
      map.setView([37.5, 137], 6, { animate: true });
      // Add zoom listener for forestry markers
      map.on("zoomend", () => {
        const zoom = map.getZoom();
        if (zoom >= 10) {
          if (!map.hasLayer(forestryLayerGroupRef.current)) {
            forestryLayerGroupRef.current.addTo(map);
          }
        } else {
          forestryLayerGroupRef.current.removeFrom(map);
        }
      });
    } else {
      // overlay mode
      tnfdLayerGroupRef.current.addTo(map);
      if (showAreas) {
        areaLayerGroupRef.current.addTo(map);
        overlapLayerGroupRef.current.addTo(map);
      }
      map.setView([36, 137], 6, { animate: true });
      // Add zoom listener for forestry markers in overlay mode
      map.on("zoomend", () => {
        const zoom = map.getZoom();
        if (zoom >= 10) {
          if (!map.hasLayer(forestryLayerGroupRef.current)) {
            forestryLayerGroupRef.current.addTo(map);
          }
        } else {
          forestryLayerGroupRef.current.removeFrom(map);
        }
      });
    }

    // Reset selections
    setSelectedCompany(null);
    setSelectedForestry(null);
    setSelectedMarkerId(null);
    setSelectedArea(null);
    setSearchQuery("");
    setCategoryFilter("all");
    setForestryTypeFilter("all");
  }, [layerMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle area visibility
  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return;
    const map = mapRef.current;
    if (layerMode === "forestry" && showAreas) {
      if (!map.hasLayer(areaLayerGroupRef.current)) areaLayerGroupRef.current.addTo(map);
      overlapLayerGroupRef.current.removeFrom(map);
    } else if (layerMode === "overlay" && showAreas) {
      if (!map.hasLayer(areaLayerGroupRef.current)) areaLayerGroupRef.current.addTo(map);
      if (!map.hasLayer(overlapLayerGroupRef.current)) overlapLayerGroupRef.current.addTo(map);
    } else {
      areaLayerGroupRef.current.removeFrom(map);
      overlapLayerGroupRef.current.removeFrom(map);
    }
  }, [showAreas, layerMode]);

  const handleCompanySelect = useCallback(
    (company: CompanyData) => {
      setSelectedCompany(company);
      setSelectedMarkerId(null);
      setSelectedForestry(null);
      setSelectedArea(null);
      if (mapRef.current) {
        mapRef.current.closePopup();
        if (company.locations.length > 1) {
          const bounds = L.latLngBounds(
            company.locations.map((loc) => L.latLng(loc.latitude, loc.longitude))
          );
          mapRef.current.fitBounds(bounds, { padding: [50, 400, 50, 50], animate: true });
        } else if (company.locations.length === 1) {
          mapRef.current.setView(
            [company.locations[0].latitude, company.locations[0].longitude],
            6,
            { animate: true }
          );
        }
      }
      // Highlight selected company markers
      tnfdMarkersRef.current.forEach((m, idx) => {
        const md = allMarkers[idx];
        if (md.companyName === company.companyName) {
          m.setRadius(9);
          m.setStyle({ weight: 2, color: "rgba(255,255,255,0.9)" });
        } else {
          m.setRadius(5);
          m.setStyle({ weight: 1.5, color: "rgba(255,255,255,0.6)" });
        }
      });
    },
    []
  );

  const handleForestrySelect = useCallback(
    (entry: ForestryEntry) => {
      setSelectedForestry(entry);
      setSelectedCompany(null);
      setSelectedMarkerId(null);
      setSelectedArea(null);
      if (mapRef.current) {
        mapRef.current.closePopup();
        mapRef.current.setView([entry.latitude, entry.longitude], 10, { animate: true });
      }
    },
    []
  );

  const handleClosePanel = useCallback(() => {
    setSelectedCompany(null);
    setSelectedForestry(null);
    setSelectedMarkerId(null);
    setSelectedArea(null);
    if (mapRef.current) mapRef.current.closePopup();
    tnfdMarkersRef.current.forEach((m) => {
      m.setRadius(5);
      m.setStyle({ weight: 1.5, color: "rgba(255,255,255,0.6)" });
    });
  }, []);

  const handleResetView = useCallback(() => {
    if (mapRef.current) {
      if (layerMode === "tnfd") {
        mapRef.current.setView([20, 100], 3, { animate: true });
      } else if (layerMode === "forestry") {
        mapRef.current.setView([37.5, 137], 6, { animate: true });
      } else {
        mapRef.current.setView([36, 137], 6, { animate: true });
      }
    }
    handleClosePanel();
  }, [layerMode, handleClosePanel]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.6); }
        }
      `}</style>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="p-4 md:p-6">
          <div className="pointer-events-auto inline-flex items-center gap-3 bg-card/80 backdrop-blur-xl border border-border/50 rounded-lg px-4 py-3 shadow-2xl">
            {layerMode === "tnfd" ? (
              <Globe2 className="w-6 h-6 text-primary" />
            ) : layerMode === "forestry" ? (
              <TreePine className="w-6 h-6 text-green-500" />
            ) : (
              <Layers className="w-6 h-6 text-amber-400" />
            )}
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight text-foreground">
                {layerMode === "tnfd"
                  ? "TNFD 優先地域マップ"
                  : layerMode === "forestry"
                  ? "日本林業 活動エリアマップ"
                  : "重ね合わせ分析マップ"}
              </h1>
              <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {layerMode === "tnfd"
                  ? `${tnfdStats.totalCompanies} Companies / ${tnfdStats.totalLocations} Priority Locations`
                  : layerMode === "forestry"
                  ? `${forestryStats.total} Companies / ${forestryAreasRef.current.length || "..."} Municipal Areas`
                  : `TNFD ${overlayStats.tnfdTotal} + Forestry ${overlayStats.forestryTotal} / Overlap ${overlayStats.overlapAreas} Areas`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Layer Switch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center bg-card/90 backdrop-blur-xl border border-border/50 rounded-full shadow-2xl p-1">
          <button
            onClick={() => setLayerMode("tnfd")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all ${
              layerMode === "tnfd"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            TNFD
          </button>
          <button
            onClick={() => setLayerMode("forestry")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all ${
              layerMode === "forestry"
                ? "bg-green-600 text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TreePine className="w-3.5 h-3.5" />
            林業エリア
          </button>
          <button
            onClick={() => setLayerMode("overlay")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all ${
              layerMode === "overlay"
                ? "bg-amber-500 text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            重ね合わせ
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {layerMode === "tnfd" ? (
        <StatsBar stats={tnfdStats} />
      ) : layerMode === "forestry" ? (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-4 bg-card/80 backdrop-blur-xl border border-border/50 rounded-lg px-4 py-2 shadow-2xl">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {forestryStats.total}
              </span>
              <span className="text-[10px] text-muted-foreground">社 /</span>
              <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {forestryAreasRef.current.length || "..."}
              </span>
              <span className="text-[10px] text-muted-foreground">エリア</span>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22C55E" }} />
                <span className="text-[10px] text-muted-foreground">民間</span>
                <span className="text-xs font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{forestryStats.minkan}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
                <span className="text-[10px] text-muted-foreground">森林組合</span>
                <span className="text-xs font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{forestryStats.kumiai}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#EF4444" }} />
                <span className="text-[10px] text-muted-foreground">大手</span>
                <span className="text-xs font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{forestryStats.oote}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-3 bg-card/80 backdrop-blur-xl border border-border/50 rounded-lg px-4 py-2 shadow-2xl">
            <div className="flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-muted-foreground">TNFD</span>
              <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {overlayStats.tnfdTotal}
              </span>
              <span className="text-[10px] text-muted-foreground">地域</span>
            </div>
            <div className="w-px h-6 bg-border/50" />
            <div className="flex items-center gap-1.5">
              <TreePine className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[10px] text-muted-foreground">林業</span>
              <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {overlayStats.forestryAreas}
              </span>
              <span className="text-[10px] text-muted-foreground">エリア</span>
            </div>
            <div className="w-px h-6 bg-border/50" />
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[10px] text-muted-foreground">重複</span>
              <span className="text-lg font-bold text-red-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {overlayStats.overlapAreas}
              </span>
              <span className="text-[10px] text-muted-foreground">エリア</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <MapLegend mode={layerMode} />

      {/* Area Toggle (forestry & overlay modes) */}
      {(layerMode === "forestry" || layerMode === "overlay") && (
        <div className="absolute bottom-24 left-4 z-[1000]">
          <button
            onClick={() => setShowAreas(!showAreas)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-2xl transition-all border ${
              showAreas
                ? "bg-green-600/90 text-white border-green-500/50"
                : "bg-card/80 text-muted-foreground border-border/50 hover:bg-accent"
            } backdrop-blur-xl`}
          >
            <div className={`w-3 h-3 rounded-sm border ${showAreas ? "bg-white border-white" : "border-muted-foreground"}`}>
              {showAreas && <svg viewBox="0 0 12 12" className="w-3 h-3 text-green-600"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" /></svg>}
            </div>
            活動エリア表示
          </button>
        </div>
      )}

      {/* Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 right-4 z-[1000] bg-card/80 backdrop-blur-xl border border-border/50 rounded-lg p-2.5 shadow-2xl hover:bg-accent transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5 text-foreground" /> : <List className="w-5 h-5 text-foreground" />}
      </button>

      {/* Reset View Button */}
      <button
        onClick={handleResetView}
        className="absolute top-16 right-4 z-[1000] bg-card/80 backdrop-blur-xl border border-border/50 rounded-lg p-2.5 shadow-2xl hover:bg-accent transition-colors"
        title="全体表示に戻す"
      >
        <Globe2 className="w-5 h-5 text-foreground" />
      </button>

      {/* Full Screen Map */}
      <MapView
        className="w-full h-full"
        initialCenter={{ lat: 20, lng: 100 }}
        initialZoom={3}
        onMapReady={handleMapReady}
      />

      {/* TNFD Company Detail Panel */}
      <AnimatePresence>
        {selectedCompany && (layerMode === "tnfd" || layerMode === "overlay") && (
          <CompanyPanel
            company={selectedCompany}
            highlightedLocationId={selectedMarkerId}
            onClose={handleClosePanel}
            onLocationClick={(loc) => {
              if (mapRef.current) {
                mapRef.current.setView([loc.latitude, loc.longitude], 8, { animate: true });
                setSelectedMarkerId(loc.id);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Forestry Detail Panel */}
      <AnimatePresence>
        {selectedForestry && !selectedArea && (layerMode === "forestry" || layerMode === "overlay") && (
          <ForestryPanel
            entry={selectedForestry}
            onClose={handleClosePanel}
          />
        )}
      </AnimatePresence>

      {/* Area Detail Panel */}
      <AnimatePresence>
        {selectedArea && (layerMode === "forestry" || layerMode === "overlay") && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-4 left-4 z-[1000] w-[380px] max-w-[calc(100vw-2rem)] bg-card/95 backdrop-blur-2xl border border-border/50 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">{selectedArea.p}</div>
                  <h3 className="text-lg font-bold text-foreground">{selectedArea.m}</h3>
                </div>
                <button onClick={() => setSelectedArea(null)} className="p-1 hover:bg-accent rounded">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  林業事業者 {selectedArea.cnt}社
                </span>
                {(() => {
                  const tnfdInJapan = allMarkers.filter(
                    (m) => m.latitude >= 24 && m.latitude <= 46 && m.longitude >= 122 && m.longitude <= 154
                  );
                  const overlapping = tnfdInJapan.filter((m) => isInBbox(m.latitude, m.longitude, selectedArea.b));
                  if (overlapping.length > 0) {
                    return (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        TNFD重複 {overlapping.length}件
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {selectedArea.cos.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: c.t === "民間" ? "#22C55E" : c.t === "森林組合" ? "#3B82F6" : "#EF4444" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{c.n}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{c.t}</span>
                        {c.a && <span className="text-[10px] text-muted-foreground">| {c.a}</span>}
                      </div>
                      {c.u && c.u.startsWith("http") && (
                        <a
                          href={c.u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline mt-0.5 block truncate"
                        >
                          出典資料
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-0 right-0 h-full w-[380px] max-w-[90vw] z-[1001] bg-card/95 backdrop-blur-2xl border-l border-border/50 shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {layerMode === "tnfd"
                    ? "企業一覧（TNFD）"
                    : layerMode === "forestry"
                    ? "林業会社一覧"
                    : "全データ一覧"}
                </h2>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-accent rounded">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={layerMode === "tnfd" ? "企業名・地域名で検索..." : "会社名・地域名で検索..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-background/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Category Filter */}
              {layerMode === "tnfd" ? (
                <div className="flex gap-1.5 flex-wrap">
                  {(["all", "直接操業", "バリューチェーン", "両方"] as CategoryFilter[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        categoryFilter === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/50 text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {cat === "all" ? "すべて" : cat}
                    </button>
                  ))}
                </div>
              ) : layerMode === "forestry" ? (
                <div className="flex gap-1.5 flex-wrap">
                  {(["all", "民間", "森林組合", "大手"] as ForestryTypeFilter[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForestryTypeFilter(t)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        forestryTypeFilter === t
                          ? "bg-green-600 text-white"
                          : "bg-background/50 text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {t === "all" ? "すべて" : t}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-1.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    TNFD {tnfdStats.totalCompanies}社
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    林業 {forestryStats.total}社
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                    重複 {overlayStats.overlapAreas}エリア
                  </span>
                </div>
              )}
            </div>

            {/* List */}
            {layerMode === "overlay" ? (
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 border-b border-border/30">
                  <h3 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" /> TNFD 企業
                  </h3>
                </div>
                <CompanyList
                  companies={filteredCompanies}
                  selectedName={selectedCompany?.companyName ?? null}
                  onSelect={handleCompanySelect}
                />
                <div className="p-3 border-b border-border/30 border-t border-border/30">
                  <h3 className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1.5">
                    <TreePine className="w-3 h-3" /> 林業会社
                  </h3>
                </div>
                <ForestryList
                  entries={filteredForestry}
                  selectedId={selectedForestry?.id ?? null}
                  onSelect={handleForestrySelect}
                />
              </div>
            ) : layerMode === "tnfd" ? (
              <CompanyList
                companies={filteredCompanies}
                selectedName={selectedCompany?.companyName ?? null}
                onSelect={handleCompanySelect}
              />
            ) : (
              <ForestryList
                entries={filteredForestry}
                selectedId={selectedForestry?.id ?? null}
                onSelect={handleForestrySelect}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
