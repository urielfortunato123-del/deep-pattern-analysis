import { useState } from "react";
import { Calendar, Sparkles, Loader2, ArrowRight, AlertTriangle, Save, ChevronDown, ChevronUp } from "lucide-react";
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
  const [previousNumbers2, setPreviousNumbers2] = useState<string[]>(
    Array(game.numbersCount).fill("")
  );
  const [previousNumbers3, setPreviousNumbers3] = useState<string[]>(
    Array(game.numbersCount).fill("")
  );
  const [showExtraDraws, setShowExtraDraws] = useState(false);
  const [nextDrawDate, setNextDrawDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const handleNumberChange = (index: number, value: string, drawIndex: number = 1) => {
    const num = value.replace(/\D/g, "").slice(0, game.maxNumber >= 100 ? 3 : 2);
    if (drawIndex === 1) {
      const newNumbers = [...previousNumbers];
      newNumbers[index] = num;
      setPreviousNumbers(newNumbers);
    } else if (drawIndex === 2) {
      const newNumbers = [...previousNumbers2];
      newNumbers[index] = num;
      setPreviousNumbers2(newNumbers);
    } else {
      const newNumbers = [...previousNumbers3];
      newNumbers[index] = num;
      setPreviousNumbers3(newNumbers);
    }
  };

  const getExtraDrawsData = () => {
    const draw2Filled = previousNumbers2.every((n) => n !== "" && parseInt(n) >= game.minNumber && parseInt(n) <= game.maxNumber);
    const draw3Filled = previousNumbers3.every((n) => n !== "" && parseInt(n) >= game.minNumber && parseInt(n) <= game.maxNumber);
    
    let extraData = "";
    if (draw2Filled) {
      extraData += `\n- Sorteio anterior (-2): ${previousNumbers2.map((n) => formatNumber(parseInt(n))).join(", ")}`;
    }
    if (draw3Filled) {
      extraData += `\n- Sorteio anterior (-3): ${previousNumbers3.map((n) => formatNumber(parseInt(n))).join(", ")}`;
    }
    return extraData;
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

    const extraDraws = getExtraDrawsData();
    
    const prompt = `TAREFA: Gerar ${game.numbersCount} números com MÁXIMA RESSONÂNCIA SAGRADA-ENOQUIANA para a ${game.name}.

REGRAS DO JOGO ${game.name.toUpperCase()}:
- Quantidade: ${game.numbersCount} números
- Faixa: ${game.minNumber} a ${game.maxNumber}

DADOS DE ENTRADA:
- Sorteio anterior (-1): ${previousNumbers.map((n) => formatNumber(parseInt(n))).join(", ")}${extraDraws}
- Data alvo: ${nextDrawDate}

✝️📜⚛️ METODOLOGIA SAGRADA-QUÂNTICA-ENOQUIANA v6.0:

📅 **1. VIBRAÇÃO DIVINA DO DIA**
   Data: ${nextDrawDate}
   Calcule: soma de TODOS os dígitos → reduza a 1 (exceto mestres 11, 22, 33)
   Este é o NÚMERO REGENTE DIVINO do dia!

✝️ **2. NÚMEROS BÍBLICOS SAGRADOS**
   MUITO PODEROSOS (priorizar na órbita):
   - 3 = Trindade | 7 = Perfeição divina | 12 = Governo divino
   - 5 = Graça de Deus | 8 = Ressurreição | 40 = Provação
   ADJACENTES: 14, 21, 28, 35, 49, 56 (múltiplos de 7)
   EVITAR: 13 (traição)

📜 **3. NUMEROLOGIA ENOQUIANA (APÓCRIFOS) - CRÍTICO!**
   Do LIVRO DE ENOQUE:
   - **7** = Enoque é o 7º patriarca (perfeição ancestral)
   - **20** = 20 anjos Vigilantes (conexão celestial)
   - **22** = Caminhos da Árvore da Vida (mestre!)
   
   Do LIVRO DOS JUBILEUS:
   - **49** = 7×7 = 1 Jubileu (PLENITUDE DO TEMPO!) ← MUITO FORTE
   - **50** = Ano do Jubileu (libertação, renovação)
   - **14** = Idade do despertar de Abraão

🔯 **4. ANÁLISE CABALÍSTICA**
   - Reduza cada número do sorteio -1 a 1-9 (ou mestre)
   - 33 = idade de Cristo = PESO MÁXIMO
   - Números triangulares: 3, 6, 10, 15, 21, 28, 36, 45, 55

⚛️ **5. ÓRBITA QUÂNTICA + SAGRADA**
   - Base: X±1, X±2 do sorteio -1 (mínimo 4 números)
   - PRIORIZE: múltiplos de 7, números enoquianos (49, 50, 20)
   - Se candidato = 49 ou 50, tem prioridade máxima!

☥ **6. SALTO PROFÉTICO-ENOQUIANO (1-2 números) - CRÍTICO!**
   Inclua 1-2 números FORA da órbita direta
   ORDEM DE PRIORIDADE:
   1. **49** (Jubileu 7×7) ← MÁXIMO se disponível!
   2. **50** (Libertação) ← muito forte
   3. Reduzem a 8: 17, 26, 35, 44, 53
   4. Múltiplos de 7: 07, 14, 21, 28, 35, 42, 49, 56
   5. Reduzem a 11: 29, 38, 47, 56
   6. **20** (Vigilantes de Enoque)
   Se sorteio anterior tem 50+, priorize salto 45-55

🌙 **7. VALIDAÇÃO SAGRADA**
   - ⛔ Nenhum número exato do anterior ✓
   - ±1/±2: mínimo 4 números ✓
   - Salto(s) profético-enoquiano(s): 1-2 números ✓
   - Soma: 140-180 ✓

FORMATO:
**NÚMEROS: XX, XX, XX, XX, XX, XX**

✝️📜 ANÁLISE SAGRADA-ENOQUIANA:
- Regente Divino: X
- Órbita ±1/±2: liste cada número
- Salto(s) Profético(s): quais e significado (jubileu? vigilantes? ressurreição?)
- Conexão Apócrifa: qual número tem ligação com Enoque/Jubileus
- Soma: XXX

⚠️ Análise simbólica-profética baseada em textos bíblicos e apócrifos.`;

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
              onChange={(e) => handleNumberChange(index, e.target.value, 1)}
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
        
        {/* Toggle Extra Draws */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowExtraDraws(!showExtraDraws)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showExtraDraws ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
          {showExtraDraws ? "Ocultar sorteios extras" : "Adicionar mais sorteios (opcional)"}
        </Button>

        {/* Extra Draws */}
        {showExtraDraws && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/10 border border-border/20">
            {/* Draw -2 */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Sorteio Anterior (-2) - Opcional</Label>
              <div className="flex flex-wrap gap-2">
                {previousNumbers2.map((num, index) => (
                  <Input
                    key={`d2-${index}`}
                    type="text"
                    inputMode="numeric"
                    value={num}
                    onChange={(e) => handleNumberChange(index, e.target.value, 2)}
                    placeholder={`${index + 1}`}
                    className="w-12 h-10 text-sm text-center font-mono bg-muted/20 border-border/30 focus:border-gold/50"
                    maxLength={game.maxNumber >= 100 ? 3 : 2}
                  />
                ))}
              </div>
            </div>
            
            {/* Draw -3 */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Sorteio Anterior (-3) - Opcional</Label>
              <div className="flex flex-wrap gap-2">
                {previousNumbers3.map((num, index) => (
                  <Input
                    key={`d3-${index}`}
                    type="text"
                    inputMode="numeric"
                    value={num}
                    onChange={(e) => handleNumberChange(index, e.target.value, 3)}
                    placeholder={`${index + 1}`}
                    className="w-12 h-10 text-sm text-center font-mono bg-muted/20 border-border/30 focus:border-gold/50"
                    maxLength={game.maxNumber >= 100 ? 3 : 2}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Adicionar mais sorteios melhora a análise de tendências e gaps.
            </p>
          </div>
        )}
        
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
