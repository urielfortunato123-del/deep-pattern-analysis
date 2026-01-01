interface StatRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  icon?: string;
}

export const StatRow = ({ label, value, highlight = false, icon }: StatRowProps) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {label}
      </span>
      <span className={highlight ? "text-gold font-semibold font-mono" : "text-foreground font-mono"}>
        {value}
      </span>
    </div>
  );
};
