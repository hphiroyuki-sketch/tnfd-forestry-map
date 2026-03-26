/**
 * CompanyList - サイドバーの企業一覧（複数地域対応）
 * Design: スクロール可能なリスト、カテゴリ色付きインジケーター
 */
import { type CompanyData } from "@/data/companyLocations";
import { MapPin } from "lucide-react";

interface CompanyListProps {
  companies: CompanyData[];
  selectedName: string | null;
  onSelect: (company: CompanyData) => void;
}

const categoryColors: Record<string, string> = {
  "直接操業": "#F59E0B",
  "バリューチェーン": "#06B6D4",
  "両方": "#10B981",
  "情報なし": "#8B5CF6",
};

export function CompanyList({ companies, selectedName, onSelect }: CompanyListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        {companies.map((company) => {
          const isSelected = company.companyName === selectedName;
          // Get primary category (most frequent)
          const categoryCounts: Record<string, number> = {};
          company.locations.forEach((loc) => {
            categoryCounts[loc.category] = (categoryCounts[loc.category] || 0) + 1;
          });
          const primaryCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "情報なし";
          const color = categoryColors[primaryCategory] || "#8B5CF6";

          // Get unique location names (up to 3)
          const locationNames = company.locations.map((l) => l.name);
          const displayLocations = locationNames.slice(0, 3).join("、");
          const remaining = locationNames.length - 3;

          return (
            <button
              key={company.companyName}
              onClick={() => onSelect(company)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all group ${
                isSelected
                  ? "bg-primary/15 border border-primary/30"
                  : "hover:bg-accent/50 border border-transparent"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}50` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                      {company.companyName}
                    </p>
                    <span
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: `${color}20`,
                        color: color,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {company.locations.length}地域
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-[11px] text-muted-foreground truncate">
                      {displayLocations}{remaining > 0 ? ` 他${remaining}件` : ""}
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
          {companies.length} companies displayed
        </p>
      </div>
    </div>
  );
}
