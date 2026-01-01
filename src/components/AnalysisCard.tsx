import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnalysisCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "default" | "highlight" | "mystic";
}

export const AnalysisCard = ({
  title,
  icon,
  children,
  className,
  delay = 0,
  variant = "default",
}: AnalysisCardProps) => {
  const variantClasses = {
    default: "glass-card",
    highlight: "glass-card border-gold/30 shadow-gold",
    mystic: "glass-card border-cosmic-purple/30 shadow-cosmic",
  };

  return (
    <div
      className={cn(
        "rounded-xl p-6 opacity-0 animate-fade-in",
        variantClasses[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="text-gold">{icon}</div>}
        <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
      </div>
      <div className="text-secondary-foreground">{children}</div>
    </div>
  );
};
