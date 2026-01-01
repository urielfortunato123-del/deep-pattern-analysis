import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  numbers: number[];
  gameName: string;
  drawDate: string;
}

export const ShareButtons = ({ numbers, gameName, drawDate }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formattedNumbers = numbers.map((n) => n.toString().padStart(2, "0")).join(" - ");
  const shareText = `🎲 ${gameName}\n📅 Sorteio: ${drawDate}\n🔢 Números: ${formattedNumbers}\n\n⚛️ Gerado pelo Oráculo Quântico`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: "Copiado! 📋" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        variant: "destructive",
      });
    }
  };

  const shareWhatsApp = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={copyToClipboard}
        className="border-border/30 hover:bg-muted/30"
      >
        {copied ? (
          <Check className="w-4 h-4 mr-1 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 mr-1" />
        )}
        Copiar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={shareWhatsApp}
        className="border-green-500/30 text-green-500 hover:bg-green-500/10"
      >
        <Share2 className="w-4 h-4 mr-1" />
        WhatsApp
      </Button>
    </div>
  );
};
