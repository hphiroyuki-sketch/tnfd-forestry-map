/**
 * CompanyPanel - 選択された企業の詳細情報パネル（複数地域対応）
 * Design: ダークグラスモーフィズム、左下にスライドイン
 */
import { type CompanyData, type LocationData } from "@/data/companyLocations";
import { motion } from "framer-motion";
import { X, ExternalLink, MapPin, Link2 } from "lucide-react";

interface CompanyPanelProps {
  company: CompanyData;
  highlightedLocationId: number | null;
  onClose: () => void;
  onLocationClick: (loc: LocationData) => void;
}

const categoryConfig: Record<string, { color: string; label: string; labelEn: string }> = {
  "直接操業": { color: "#F59E0B", label: "直接操業", labelEn: "Direct Operations" },
  "バリューチェーン": { color: "#06B6D4", label: "バリューチェーン", labelEn: "Value Chain" },
  "両方": { color: "#10B981", label: "直接操業 + バリューチェーン", labelEn: "Both" },
  "情報なし": { color: "#8B5CF6", label: "情報なし", labelEn: "N/A" },
};

export function CompanyPanel({ company, highlightedLocationId, onClose, onLocationClick }: CompanyPanelProps) {
  // Get unique categories for this company
  const companyCategories = Array.from(new Set(company.locations.map((l) => l.category)));
  const primaryCategory = companyCategories[0] || "情報なし";
  const config = categoryConfig[primaryCategory] || categoryConfig["情報なし"];

  // Parse source URLs
  const sourceUrlList = company.sourceUrls
    ? company.sourceUrls.split(",").map((u) => u.trim()).filter((u) => u && u.startsWith("http"))
    : [];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-4 left-4 z-20 w-[440px] max-w-[calc(100vw-2rem)] max-h-[70vh] bg-card/95 backdrop-blur-2xl border border-border/50 rounded-xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Color accent bar */}
      <div className="h-1 flex-shrink-0" style={{ background: `linear-gradient(90deg, ${config.color}, transparent)` }} />

      <div className="p-5 overflow-y-auto flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {companyCategories.map((cat) => {
                const catConfig = categoryConfig[cat] || categoryConfig["情報なし"];
                return (
                  <span key={cat} className="inline-flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: catConfig.color, boxShadow: `0 0 6px ${catConfig.color}60` }}
                    />
                    <span
                      className="text-[9px] font-medium uppercase tracking-wider"
                      style={{ color: catConfig.color, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {catConfig.labelEn}
                    </span>
                  </span>
                );
              })}
            </div>
            <h3 className="text-lg font-bold text-foreground leading-tight" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {company.companyName}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {company.locations.length} priority location{company.locations.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Locations List */}
        <div className="space-y-2 mb-4">
          {company.locations.map((loc) => {
            const locConfig = categoryConfig[loc.category] || categoryConfig["情報なし"];
            const isHighlighted = loc.id === highlightedLocationId;

            return (
              <button
                key={loc.id}
                onClick={() => onLocationClick(loc)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isHighlighted
                    ? "bg-primary/15 border-primary/40"
                    : "bg-background/50 border-border/30 hover:bg-background/80"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <MapPin
                    className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                    style={{ color: locConfig.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{loc.name}</p>
                      <span
                        className="text-[8px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: `${locConfig.color}20`,
                          color: locConfig.color,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {loc.category === "バリューチェーン" ? "VC" : loc.category === "直接操業" ? "DO" : loc.category === "両方" ? "Both" : "N/A"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{loc.reason}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Source URLs */}
        {sourceUrlList.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              出典資料
            </p>
            {sourceUrlList.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors group"
              >
                <Link2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-[11px] text-primary truncate flex-1">{url}</span>
                <ExternalLink className="w-3 h-3 text-primary/60 group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
