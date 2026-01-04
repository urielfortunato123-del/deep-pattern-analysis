import { useState } from "react";
import { Calendar, Sparkles, Loader2, ArrowRight, AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LotteryGame } from "@/lib/lotteryGames";
import { ShareButtons } from "@/components/ShareButtons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface GeneratedResult {
  numbers: number[];
  analysis: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quantum-oracle`;

interface GameGeneratorProps {
  game: LotteryGame;
}

export const GameGenerator = ({ game }: GameGeneratorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [previousNumbers, setPreviousNumbers] = useState<string[]>(
    Array(game.numbersCount).fill("")
  );
  const [nextDrawDate, setNextDrawDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const handleNumberChange = (index: number, value: string) => {
    const num = value.replace(/\D/g, "").slice(0, game.maxNumber >= 100 ? 3 : 2);
    const newNumbers = [...previousNumbers];
    newNumbers[index] = num;
    setPreviousNumbers(newNumbers);
  };

  const isValidInput = () => {
    const allFilled = previousNumbers.every((n) => {
      const num = parseInt(n);
      return n !== "" && num >= game.minNumber && num <= game.maxNumber;
    });
    const uniqueNumbers = new Set(previousNumbers.filter((n) => n !== "")).size === game.numbersCount;
    return allFilled && uniqueNumbers && nextDrawDate !== "";
  };

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, "0");
  };

  const saveGame = async () => {
    if (!user || !result) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from("generated_games").insert({
        user_id: user.id,
        game_type: game.id,
        game_name: game.name,
        numbers: result.numbers,
        previous_numbers: previousNumbers.map((n) => parseInt(n)),
        draw_date: nextDrawDate,
        analysis: result.analysis,
      });

      if (error) throw error;
      toast({ title: "Jogo salvo! 💾" });
    } catch (error) {
      console.error("Error saving game:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateNumbers = async () => {
    if (!isValidInput()) {
      toast({
        title: "Dados incompletos",
        description: `Preencha todos os ${game.numbersCount} números (${game.minNumber}-${game.maxNumber}, sem repetir) e a data.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const prompt = `TAREFA: Gerar ${game.numbersCount} números ALTAMENTE OTIMIZADOS para a ${game.name}.

REGRAS DO JOGO ${game.name.toUpperCase()}:
- Quantidade: ${game.numbersCount} números
- Faixa: ${game.minNumber} a ${game.maxNumber}

DADOS DE ENTRADA:
- Sorteio anterior: ${previousNumbers.map((n) => formatNumber(parseInt(n))).join(", ")}
- Data alvo: ${nextDrawDate}

⚛️ METODOLOGIA QUÂNTICA AVANÇADA v2.0:

1. **ANÁLISE DE ÓRBITA (CRÍTICO)**
   Para CADA número do sorteio anterior, calcule a "zona de influência":
   - Número X → gere candidatos em X±1, X±2, X±3 (prioridade máxima)
   - Número X → considere também X±4 a X±6 (prioridade média)
   - NUNCA repita o número exato do sorteio anterior
   - Exemplo prático: se saiu 22, priorize 19, 20, 21, 23, 24, 25

2. **DISTRIBUIÇÃO PERFEITA**
   - Cobrir EXATAMENTE 5 ou 6 faixas decimais diferentes
   - Equilíbrio: ${Math.floor(game.numbersCount/2)} pares + ${Math.ceil(game.numbersCount/2)} ímpares (ou vice-versa)
   - TODOS os finais devem ser ÚNICOS (0-9, sem repetição)
   - ZERO sequências consecutivas (12-13 ou 45-46 = proibido)

3. **NÚMEROS ANTI-REBANHO**
   EVITE (muito apostados):
   - Supersticiosos: 7, 13, 21, 33
   - Extremos: 1, 2, 59, 60
   - Datas: 01 a 31 (aniversários)
   
   PREFIRA (pouco apostados):
   - "Feios": 38, 41, 43, 47, 52, 56, 58
   - Primos altos: 37, 41, 43, 47, 53
   - Dezena 40-50 (menos popular)

4. **SOMA IDEAL**
   - Mega-Sena: soma entre 140-180 (média histórica ~167)
   - Evite extremos (<120 ou >210)

5. **VALIDAÇÃO FINAL**
   Antes de responder, VERIFIQUE:
   ✓ Todos os finais são diferentes?
   ✓ Nenhuma sequência consecutiva?
   ✓ Pelo menos 4 números estão na órbita (±3) do sorteio anterior?
   ✓ Soma está entre 140-180?
   ✓ Tem números da dezena 40-50?

FORMATO OBRIGATÓRIO:
**NÚMEROS: XX, XX, XX, XX, XX, XX**

ANÁLISE (máx 250 palavras):
- Quantos números estão na órbita ±3 do anterior
- Distribuição por faixas
- Finais únicos confirmados
- Índice de otimização (%)

⚠️ Análise probabilística, não previsão garantida.`;

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
          .filter((n) => !isNaN(n) && n >= game.minNumber && n <= game.maxNumber)
          .slice(0, game.numbersCount);
      }

      if (extractedNumbers.length !== game.numbersCount) {
        const regex = game.maxNumber >= 100 ? /\b(\d{1,3})\b/g : /\b(\d{1,2})\b/g;
        const allNumbers = fullResponse.match(regex);
        if (allNumbers) {
          const uniqueNums = [...new Set(allNumbers.map((n) => parseInt(n)))]
            .filter((n) => n >= game.minNumber && n <= game.maxNumber);
          extractedNumbers = uniqueNums.slice(0, game.numbersCount);
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

  const isLargeGame = game.numbersCount > 10;

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-gold/10 border border-gold/30">
        <AlertTriangle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/80">
          <strong>Aviso:</strong> Análise simbólica e estatística. Loterias são aleatórias — não existe previsão garantida.
        </p>
      </div>

      {/* Previous Numbers Input */}
      <div className="space-y-3">
        <Label className="text-foreground font-medium">
          Números do Sorteio Anterior ({game.numbersCount} números)
        </Label>
        <div className={cn(
          "flex flex-wrap gap-2",
          isLargeGame && "max-h-48 overflow-y-auto p-2 bg-muted/10 rounded-lg"
        )}>
          {previousNumbers.map((num, index) => (
            <Input
              key={index}
              type="text"
              inputMode="numeric"
              value={num}
              onChange={(e) => handleNumberChange(index, e.target.value)}
              placeholder={`${index + 1}`}
              className={cn(
                "text-center font-mono bg-muted/20 border-border/30",
                "focus:border-gold/50 focus:ring-gold/20",
                isLargeGame ? "w-12 h-10 text-sm" : "w-14 h-12 text-lg"
              )}
              maxLength={game.maxNumber >= 100 ? 3 : 2}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {game.description}, sem repetição
        </p>
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
        className={cn(
          "w-full h-12 font-semibold text-lg shadow-lg",
          `bg-gradient-to-r ${game.color} hover:opacity-90 text-white`
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processando campo quântico...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Gerar Jogo
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          {/* Generated Numbers */}
          <div className={cn(
            "p-6 rounded-xl border",
            `bg-gradient-to-br ${game.color}/20 border-white/20`
          )}>
            <p className="text-sm text-muted-foreground mb-3 text-center">
              {game.icon} Números Gerados para {game.name}
            </p>
            <div className={cn(
              "flex flex-wrap justify-center gap-2",
              isLargeGame && "max-h-40 overflow-y-auto"
            )}>
              {result.numbers.map((num, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-full number-orb-active flex items-center justify-center animate-scale-in",
                    isLargeGame ? "w-10 h-10" : "w-12 h-12"
                  )}
                  style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "forwards" }}
                >
                  <span className={cn(
                    "font-display font-bold text-gold",
                    isLargeGame ? "text-sm" : "text-lg"
                  )}>
                    {formatNumber(num)}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <ShareButtons
                numbers={result.numbers}
                gameName={game.name}
                drawDate={new Date(nextDrawDate).toLocaleDateString("pt-BR")}
              />
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveGame}
                  disabled={isSaving}
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Salvar
                </Button>
              )}
            </div>
          </div>

          {/* Analysis */}
          <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
            <p className="text-sm text-muted-foreground mb-2">Análise Completa</p>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {result.analysis}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
