/**
 * StatsBar - 統計サマリーバー
 * Design: 画面上部右寄りにフローティング表示
 */

interface StatsBarProps {
  stats: {
    totalCompanies: number;
    totalLocations: number;
    direct: number;
    vc: number;
    both: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
      <div className="pointer-events-auto inline-flex items-center gap-4 bg-card/80 backdrop-blur-xl border border-border/50 rounded-lg px-4 py-2 shadow-2xl">
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {stats.totalCompanies}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            社 /
          </span>
          <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {stats.totalLocations}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            地域
          </span>
        </div>

        <div className="w-px h-8 bg-border/50" />

        <div className="flex items-center gap-3">
          <StatItem color="#F59E0B" label="直接操業" count={stats.direct} />
          <StatItem color="#06B6D4" label="VC" count={stats.vc} />
          <StatItem color="#10B981" label="両方" count={stats.both} />
        </div>
      </div>
    </div>
  );
}

function StatItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {count}
      </span>
    </div>
  );
}
