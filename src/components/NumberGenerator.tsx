import { useState } from "react";
import { Calendar, Sparkles, Loader2, Dices, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface GeneratedResult {
  numbers: number[];
  analysis: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quantum-oracle`;

export const NumberGenerator = () => {
  const { toast } = useToast();
  const [previousNumbers, setPreviousNumbers] = useState<string[]>(["", "", "", "", "", ""]);
  const [nextDrawDate, setNextDrawDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const handleNumberChange = (index: number, value: string) => {
    const num = value.replace(/\D/g, "").slice(0, 2);
    const newNumbers = [...previousNumbers];
    newNumbers[index] = num;
    setPreviousNumbers(newNumbers);
  };

  const isValidInput = () => {
    const allFilled = previousNumbers.every((n) => n !== "" && parseInt(n) >= 1 && parseInt(n) <= 60);
    const uniqueNumbers = new Set(previousNumbers.filter(n => n !== "")).size === 6;
    return allFilled && uniqueNumbers && nextDrawDate !== "";
  };

  const generateNumbers = async () => {
    if (!isValidInput()) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os 6 números (1-60, sem repetir) e a data do próximo sorteio.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const prompt = `TAREFA: Gerar 6 números para a Mega-Sena com análise completa.

DADOS DE ENTRADA:
- Números do sorteio anterior: ${previousNumbers.map(n => n.padStart(2, "0")).join(", ")}
- Data do próximo sorteio: ${nextDrawDate}

METODOLOGIA OBRIGATÓRIA:
1. ANÁLISE ESTATÍSTICA: Identifique gaps, números atrasados, padrões de distribuição
2. CABALA NUMEROLÓGICA: Reduza a data do próximo sorteio, encontre arquétipos dominantes
3. MAPA ASTRAL: Considere a posição simbólica dos planetas na data
4. LÓGICA QUÂNTICA: Evite padrões óbvios, sequências, finais repetidos demais

FORMATO DE RESPOSTA OBRIGATÓRIO:
Primeiro, liste os 6 números escolhidos no formato: **NÚMEROS: XX, XX, XX, XX, XX, XX**

Depois, explique cada número individualmente com:
- Por que foi escolhido (qual método)
- Qual arquétipo/vibração carrega
- Por que evitou alternativas

Termine com um "índice de coerência" simbólico e um aviso de que isso é análise simbólica, não previsão garantida.`;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          type: "generate",
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Erro ao gerar números");
      }

      if (!resp.body) throw new Error("Sem resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Extract numbers from response
      const numbersMatch = fullResponse.match(/\*\*NÚMEROS:\s*([\d,\s]+)\*\*/i);
      let extractedNumbers: number[] = [];
      
      if (numbersMatch) {
        extractedNumbers = numbersMatch[1]
          .split(",")
          .map((n) => parseInt(n.trim()))
          .filter((n) => !isNaN(n) && n >= 1 && n <= 60)
          .slice(0, 6);
      }

      if (extractedNumbers.length !== 6) {
        // Fallback: try to find any 6 two-digit numbers
        const allNumbers = fullResponse.match(/\b([0-5]?[0-9])\b/g);
        if (allNumbers) {
          const uniqueNums = [...new Set(allNumbers.map(n => parseInt(n)))].filter(n => n >= 1 && n <= 60);
          extractedNumbers = uniqueNums.slice(0, 6);
        }
      }

      setResult({
        numbers: extractedNumbers.sort((a, b) => a - b),
        analysis: fullResponse,
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao gerar números",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30 bg-gradient-to-r from-gold/10 to-cosmic-purple/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
            <Dices className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground">Gerador Quântico</h3>
            <p className="text-sm text-muted-foreground">Análise cabalística + estatística + astral</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-gold/10 border border-gold/30">
          <AlertTriangle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">
            <strong>Aviso:</strong> Este é um sistema de análise simbólica e estatística. 
            Loterias são aleatórias — não existe previsão garantida. Use com consciência.
          </p>
        </div>

        {/* Previous Numbers Input */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Números do Sorteio Anterior</Label>
          <div className="flex flex-wrap gap-2">
            {previousNumbers.map((num, index) => (
              <Input
                key={index}
                type="text"
                inputMode="numeric"
                value={num}
                onChange={(e) => handleNumberChange(index, e.target.value)}
                placeholder={`${index + 1}º`}
                className={cn(
                  "w-16 h-12 text-center text-lg font-mono bg-muted/20 border-border/30",
                  "focus:border-gold/50 focus:ring-gold/20"
                )}
                maxLength={2}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Números de 01 a 60, sem repetição</p>
        </div>

        {/* Date Input */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Data do Próximo Sorteio</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="date"
              value={nextDrawDate}
              onChange={(e) => setNextDrawDate(e.target.value)}
              className="pl-10 bg-muted/20 border-border/30 focus:border-gold/50"
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateNumbers}
          disabled={isLoading || !isValidInput()}
          className="w-full h-12 gradient-gold text-primary-foreground font-semibold text-lg shadow-gold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processando campo quântico...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Números
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in" style={{ animationFillMode: "forwards" }}>
            {/* Generated Numbers */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-gold/20 to-cosmic-purple/20 border border-gold/30">
              <p className="text-sm text-muted-foreground mb-3 text-center">Números Gerados</p>
              <div className="flex flex-wrap justify-center gap-3">
                {result.numbers.map((num, idx) => (
                  <div
                    key={idx}
                    className="w-14 h-14 rounded-full number-orb-active flex items-center justify-center animate-scale-in"
                    style={{ animationDelay: `${idx * 100}ms`, animationFillMode: "forwards" }}
                  >
                    <span className="text-xl font-display font-bold text-gold">
                      {num.toString().padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis */}
            <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
              <p className="text-sm text-muted-foreground mb-2">Análise Completa</p>
              <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {result.analysis}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
