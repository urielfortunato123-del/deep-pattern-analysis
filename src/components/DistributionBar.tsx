interface DistributionBarProps {
  ranges: { label: string; numbers: number[]; count: number }[];
}

export const DistributionBar = ({ ranges }: DistributionBarProps) => {
  const maxCount = Math.max(...ranges.map((r) => r.count), 1);

  return (
    <div className="space-y-3">
      {ranges.map((range) => (
        <div key={range.label} className="flex items-center gap-4">
          <span className="w-16 text-sm text-muted-foreground font-mono">{range.label}</span>
          <div className="flex-1 h-8 bg-muted/30 rounded-md overflow-hidden relative">
            <div
              className="h-full gradient-gold transition-all duration-700 ease-out rounded-md"
              style={{ width: `${(range.count / maxCount) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center px-3">
              <span className="text-sm font-mono text-foreground/80">
                {range.numbers.length > 0
                  ? range.numbers.map((n) => n.toString().padStart(2, "0")).join(", ")
                  : "—"}
              </span>
            </div>
          </div>
          <span className="w-6 text-right text-sm font-mono text-gold">{range.count}</span>
        </div>
      ))}
    </div>
  );
};
