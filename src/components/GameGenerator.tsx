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

    const prompt = `TAREFA: Gerar ${game.numbersCount} números OTIMIZADOS para a ${game.name} com análise completa.

REGRAS DO JOGO ${game.name.toUpperCase()}:
- Quantidade de números: ${game.numbersCount}
- Faixa: ${game.minNumber} a ${game.maxNumber}
- ${game.description}

DADOS DE ENTRADA:
- Números do sorteio anterior: ${previousNumbers.map((n) => formatNumber(parseInt(n))).join(", ")}
- Data do próximo sorteio: ${nextDrawDate}

⚛️ METODOLOGIA QUÂNTICA OTIMIZADA:

1. DISTRIBUIÇÃO ANTI-PADRÃO (CRÍTICO):
   - Cobrir TODAS as faixas decimais (01-10, 11-20, 21-30, etc.)
   - Equilibrar pares/ímpares (ideal: ${Math.floor(game.numbersCount/2)}/${Math.ceil(game.numbersCount/2)} ou ${Math.ceil(game.numbersCount/2)}/${Math.floor(game.numbersCount/2)})
   - EVITAR finais repetidos (ex: 05, 15, 25 = ruim)
   - EVITAR sequências consecutivas (ex: 12, 13, 14 = muito apostado)
   - Priorizar números com FINAIS ÚNICOS

2. ANÁLISE DE PROXIMIDADE:
   - Analisar cada número do sorteio anterior
   - Gerar números que orbitem ±3 a ±7 de cada número anterior
   - Exemplo: se saiu 22, considerar 17, 18, 19, 25, 26, 27, 28, 29
   - NÃO repetir os mesmos números do sorteio anterior

3. EVITAR NÚMEROS POPULARES:
   - Evitar: 7, 13, 21, 33 (superstição)
   - Evitar: 1, 60 (extremos)
   - Evitar: datas de aniversário (01-31 concentram apostas)
   - Preferir números "feios": 38, 41, 47, 52, 56, 58

4. CABALA NUMEROLÓGICA:
   - Reduzir data do sorteio (${nextDrawDate}) ao número raiz
   - Incluir números que vibrem nessa frequência

5. SOMA TOTAL:
   - A soma dos ${game.numbersCount} números deve estar entre 120-200 (Mega-Sena)
   - Evitar somas extremas (muito baixas ou muito altas)

FORMATO DE RESPOSTA OBRIGATÓRIO:
Primeiro, liste os ${game.numbersCount} números escolhidos no formato: **NÚMEROS: XX, XX, XX, ...**

Depois, dê uma análise CONCISA (máximo 300 palavras) explicando:
- Lógica de PROXIMIDADE com sorteio anterior
- Distribuição por faixas
- Equilíbrio pares/ímpares
- Por que esses números são ANTI-PADRÃO (menos apostados)
- Índice de otimização (ex: 85%)

Termine com aviso de que é análise simbólica, não previsão garantida.`;

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
