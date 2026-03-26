/**
 * ForestryPanel - 林業会社の詳細情報パネル
 * Design: ダークグラスモーフィズム、左下にスライドイン
 */
import { type ForestryEntry } from "@/data/forestryData";
import { motion } from "framer-motion";
import { X, ExternalLink, MapPin, Link2, TreePine, Building2, Landmark } from "lucide-react";

interface ForestryPanelProps {
  entry: ForestryEntry;
  onClose: () => void;
}

const typeConfig: Record<string, { color: string; label: string; icon: typeof TreePine }> = {
  "民間": { color: "#22C55E", label: "民間企業", icon: Building2 },
  "森林組合": { color: "#3B82F6", label: "森林組合", icon: TreePine },
  "大手": { color: "#EF4444", label: "大手企業", icon: Landmark },
};

export function ForestryPanel({ entry, onClose }: ForestryPanelProps) {
  const config = typeConfig[entry.type] || typeConfig["民間"];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-4 left-4 z-20 w-[440px] max-w-[calc(100vw-2rem)] bg-card/95 backdrop-blur-2xl border border-border/50 rounded-xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Color accent bar */}
      <div className="h-1 flex-shrink-0" style={{ background: `linear-gradient(90deg, ${config.color}, transparent)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: `${config.color}20`, color: config.color }}
              >
                <IconComponent className="w-3 h-3" />
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-background/50 rounded-full">
                {entry.region}
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground leading-tight" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {entry.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2.5 p-3 bg-background/50 border border-border/30 rounded-lg">
            <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                活動エリア
              </p>
              <p className="text-sm text-foreground">{entry.prefecture} {entry.area}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-background/50 border border-border/30 rounded-lg">
            <TreePine className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                活動内容
              </p>
              <p className="text-sm text-foreground">{entry.activity}</p>
            </div>
          </div>

          <div className="p-3 bg-background/50 border border-border/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              座標
            </p>
            <p className="text-xs text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {entry.latitude.toFixed(4)}°N, {entry.longitude.toFixed(4)}°E
            </p>
          </div>
        </div>

        {/* Source URL */}
        {entry.sourceUrl && entry.sourceUrl.startsWith("http") && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              出典資料
            </p>
            <a
              href={entry.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg transition-colors group"
            >
              <Link2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="text-[11px] text-green-500 truncate flex-1">{entry.sourceUrl}</span>
              <ExternalLink className="w-3 h-3 text-green-500/60 group-hover:text-green-500 transition-colors flex-shrink-0" />
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
