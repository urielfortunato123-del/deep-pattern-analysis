import { cn } from "@/lib/utils";

interface NumerologyBadgeProps {
  number: number;
  meaning: string;
  description: string;
  variant?: "gold" | "purple" | "teal";
}

export const NumerologyBadge = ({
  number,
  meaning,
  description,
  variant = "gold",
}: NumerologyBadgeProps) => {
  const variantClasses = {
    gold: "border-gold/40 bg-gold/5",
    purple: "border-cosmic-purple/40 bg-cosmic-purple/5",
    teal: "border-mystic-teal/40 bg-mystic-teal/5",
  };

  const textClasses = {
    gold: "text-gold",
    purple: "text-cosmic-purple",
    teal: "text-mystic-teal",
  };

  return (
    <div className={cn("rounded-lg border p-4", variantClasses[variant])}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-display text-xl font-bold border",
            variantClasses[variant],
            textClasses[variant]
          )}
        >
          {number}
        </div>
        <div className="flex-1">
          <p className={cn("font-semibold", textClasses[variant])}>{meaning}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};
