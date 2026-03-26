/**
 * ForestryList - サイドバーの林業会社一覧
 * Design: スクロール可能なリスト、種別色付きインジケーター
 */
import { type ForestryEntry } from "@/data/forestryData";
import { MapPin, TreePine, Building2, Landmark } from "lucide-react";

interface ForestryListProps {
  entries: ForestryEntry[];
  selectedId: number | null;
  onSelect: (entry: ForestryEntry) => void;
}

const typeColors: Record<string, string> = {
  "民間": "#22C55E",
  "森林組合": "#3B82F6",
  "大手": "#EF4444",
};

const typeIcons: Record<string, typeof TreePine> = {
  "民間": Building2,
  "森林組合": TreePine,
  "大手": Landmark,
};

export function ForestryList({ entries, selectedId, onSelect }: ForestryListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        {entries.map((entry) => {
          const isSelected = entry.id === selectedId;
          const color = typeColors[entry.type] || "#22C55E";
          const IconComp = typeIcons[entry.type] || TreePine;

          return (
            <button
              key={entry.id}
              onClick={() => onSelect(entry)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all group ${
                isSelected
                  ? "bg-green-500/15 border border-green-500/30"
                  : "hover:bg-accent/50 border border-transparent"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-1 w-2 h-2 flex-shrink-0"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}50`,
                    transform: "rotate(45deg)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                      {entry.name}
                    </p>
                    <span
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: `${color}20`,
                        color: color,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {entry.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-[11px] text-muted-foreground truncate">
                      {entry.prefecture} {entry.area}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="p-3 text-center">
        <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {entries.length} entries displayed
        </p>
      </div>
    </div>
  );
}
