/**
 * MapLegend - 地図の凡例（3レイヤーモード対応）
 * Design: 右下にフローティング表示
 */

interface MapLegendProps {
  mode: "tnfd" | "forestry" | "overlay";
}

export function MapLegend({ mode }: MapLegendProps) {
  const tnfdItems = [
    { color: "#F59E0B", label: "直接操業", shape: "circle" as const },
    { color: "#06B6D4", label: "バリューチェーン", shape: "circle" as const },
    { color: "#10B981", label: "両方", shape: "circle" as const },
    { color: "#8B5CF6", label: "その他", shape: "circle" as const },
  ];

  const forestryItems = [
    { color: "#22C55E", label: "民間企業", shape: "diamond" as const },
    { color: "#3B82F6", label: "森林組合", shape: "diamond" as const },
    { color: "#EF4444", label: "大手企業", shape: "diamond" as const },
  ];

  if (mode === "overlay") {
    return (
      <div className="absolute bottom-4 right-4 z-[1000] pointer-events-none">
        <div className="pointer-events-auto bg-card/80 backdrop-blur-xl border border-border/50 rounded-lg px-3 py-2.5 shadow-2xl">
          <p className="text-[9px] text-muted-foreground mb-2 uppercase tracking-wider font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Overlay Legend
          </p>
          <div className="mb-2">
            <p className="text-[9px] text-amber-400 mb-1 font-medium">TNFD</p>
            <div className="space-y-1">
              {tnfdItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}40` }}
                  />
                  <span className="text-[10px] text-foreground/80">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border/30 pt-2">
            <p className="text-[9px] text-green-400 mb-1 font-medium">林業</p>
            <div className="space-y-1">
              {forestryItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 flex-shrink-0"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 6px ${item.color}40`,
                      borderRadius: "1px",
                      transform: "rotate(45deg)",
                    }}
                  />
                  <span className="text-[10px] text-foreground/80">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border/30 pt-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: "rgba(34, 197, 94, 0.3)", border: "1px solid rgba(34, 197, 94, 0.5)" }} />
              <span className="text-[10px] text-foreground/80">林業活動密度</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const items = mode === "tnfd" ? tnfdItems : forestryItems;

  return (
    <div className="absolute bottom-4 right-4 z-[1000] pointer-events-none">
      <div className="pointer-events-auto bg-card/80 backdrop-blur-xl border border-border/50 rounded-lg px-3 py-2.5 shadow-2xl">
        <p className="text-[9px] text-muted-foreground mb-2 uppercase tracking-wider font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {mode === "tnfd" ? "TNFD Legend" : "Forestry Legend"}
        </p>
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 flex-shrink-0"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 6px ${item.color}40`,
                  borderRadius: item.shape === "circle" ? "50%" : "1px",
                  transform: item.shape === "diamond" ? "rotate(45deg)" : "none",
                }}
              />
              <span className="text-[11px] text-foreground/80">{item.label}</span>
            </div>
          ))}
        </div>
        {mode === "forestry" && (
          <div className="border-t border-border/30 pt-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: "rgba(34, 197, 94, 0.3)", border: "1px solid rgba(34, 197, 94, 0.5)" }} />
              <span className="text-[10px] text-foreground/80">林業活動密度</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
