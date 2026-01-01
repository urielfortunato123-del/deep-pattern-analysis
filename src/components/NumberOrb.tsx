import { cn } from "@/lib/utils";

interface NumberOrbProps {
  number: number;
  delay?: number;
  size?: "sm" | "md" | "lg";
  active?: boolean;
}

export const NumberOrb = ({ number, delay = 0, size = "lg", active = true }: NumberOrbProps) => {
  const sizeClasses = {
    sm: "w-10 h-10 text-lg",
    md: "w-14 h-14 text-xl",
    lg: "w-20 h-20 text-3xl",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-display font-bold transition-all duration-500",
        active ? "number-orb-active animate-glow-pulse" : "number-orb",
        sizeClasses[size],
        "opacity-0 animate-scale-in"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <span className="text-gold glow-gold">{number.toString().padStart(2, "0")}</span>
    </div>
  );
};
