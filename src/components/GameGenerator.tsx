import { useState } from "react";
import { Calendar, Sparkles, Loader2, ArrowRight, AlertTriangle, Save, ChevronDown, ChevronUp, Layers, Download } from "lucide-react";
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
  isHybrid?: boolean;
  sourceGames?: number[][];
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
  const [isLoadingHybrid, setIsLoadingHybrid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [hybridProgress, setHybridProgress] = useState(0);
  const [isLoadingLastDraw, setIsLoadingLastDraw] = useState(false);
  const [lastDrawInfo, setLastDrawInfo] = useState<{ drawNumber: string; drawDate: string } | null>(null);

  const fetchLastDraw = async () => {
    setIsLoadingLastDraw(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lottery-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ gameId: game.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar último sorteio");
      }

      const data = await response.json();
      
      if (data.numbers && data.numbers.length > 0) {
        // Preencher os números
        const formattedNumbers = data.numbers.map((n: number) => n.toString().padStart(2, "0"));
        setPreviousNumbers(formattedNumbers.slice(0, game.numbersCount));
        setLastDrawInfo({ drawNumber: data.drawNumber, drawDate: data.drawDate });
        
        toast({
          title: "Último sorteio carregado! 🎯",
          description: `Concurso ${data.drawNumber} - ${data.drawDate}`,
        });
      } else {
        throw new Error("Nenhum resultado encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar último sorteio:", error);
      toast({
        title: "Erro ao buscar",
        description: error instanceof Error ? error.message : "Não foi possível buscar o último sorteio",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLastDraw(false);
    }
  };

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
    
    const prompt = `TAREFA: Gerar ${game.numbersCount} números com o SISTEMA QUÂNTICO-HERMÉTICO SUPREMO v8.0 para a ${game.name}.

═══════════════════════════════════════════════════════════════
🎰 REGRAS DO JOGO ${game.name.toUpperCase()}:
═══════════════════════════════════════════════════════════════
- Quantidade: ${game.numbersCount} números
- Faixa: ${game.minNumber} a ${game.maxNumber}

═══════════════════════════════════════════════════════════════
📊 DADOS DE ENTRADA:
═══════════════════════════════════════════════════════════════
- Sorteio anterior (-1): ${previousNumbers.map((n) => formatNumber(parseInt(n))).join(", ")}${extraDraws}
- Data do próximo sorteio: ${nextDrawDate}

═══════════════════════════════════════════════════════════════
📅 ANÁLISE OBRIGATÓRIA DA DATA: ${nextDrawDate}
═══════════════════════════════════════════════════════════════

PASSO 1 - CALCULE O REGENTE DO DIA:
- Separe todos os dígitos da data ${nextDrawDate}
- Some todos os dígitos
- Reduza até chegar a 1 dígito (exceto Mestres 11, 22, 33)
- Este é o NÚMERO REGENTE DIVINO do dia!

PASSO 2 - VERIFIQUE TESLA 3-6-9:
- Se o regente é 3, 6 ou 9 = DIA DIVINO TESLA!
- Priorize múltiplos de 9 (09, 18, 27, 36, 45, 54)
- Se NÃO é 3, 6, 9 = inclua pelo menos 1 que reduza a 9

PASSO 3 - PLANETA REGENTE (Liber 777):
- Regente 1 ou 6 = SOL (use quadrado 6×6: 06, 32, 34, 35, 37)
- Regente 2 ou 9 = LUA (use quadrado 9×9: 09, 18, 27, 36, 45, 54)
- Regente 3 = SATURNO (use quadrado 3×3: 1-9, 15, 45)
- Regente 4 = JÚPITER (use quadrado 4×4: 16, 31, 34, 52)
- Regente 5 = MARTE (use: 11, 24, 07, 20, 03)
- Regente 7 = VÊNUS (use: 07, 14, 21, 28, 35, 42, 49)
- Regente 8 = MERCÚRIO (use: 08, 17, 26, 35, 44, 53)
- Regente 11 = MESTRE URIEL (use: 11, 22, 33, 44, 55, 47)
- Regente 22 = MESTRE DOS CAMINHOS (use: 22, 44, 11, 33, 55)

PASSO 4 - ELEMENTO DO DIA (Golden Dawn):
- Calcule o dia do mês da data
- Se dia reduz a 1, 4, 7 = FOGO (use: 1, 10, 19, 28, 37, 46, 55)
- Se dia reduz a 2, 5, 8 = ÁGUA (use: 2, 11, 20, 29, 38, 47, 56)
- Se dia reduz a 3, 6, 9 = AR (use: 3, 12, 21, 30, 39, 48, 57)
- Se dia reduz a 4 = TERRA (use: 4, 13, 22, 31, 40, 49, 58)

═══════════════════════════════════════════════════════════════
⚛️ APLICAR SISTEMA SUPREMO v8.0:
═══════════════════════════════════════════════════════════════

⚡ TESLA 3-6-9: Incluir pelo menos 1 que reduza a 9
⚛️ QUÂNTICO: Incluir 14 (orbital f) ou 18/8/32 (camadas)
🌀 FIBONACCI: Incluir 21 e (34 ou 55)
🔯 MESTRE: Incluir 22 (obrigatório) ou outro (11, 33, 44, 55)
🔢 PRIMOS: Incluir 2 de (31, 37, 47, 53)
📐 TRIANGULAR: Incluir pelo menos 1 (3, 6, 10, 15, 21, 28, 36, 45, 55)

═══════════════════════════════════════════════════════════════
📊 DISTRIBUIÇÃO OBRIGATÓRIA:
═══════════════════════════════════════════════════════════════
- BAIXOS (01-20): 1-2 números
- MÉDIOS (21-40): 2-3 números
- ALTOS (41-60): 2 números
- PAR/ÍMPAR: 3+3 ou 2+4
- FINAIS ÚNICOS: cada número com final diferente

═══════════════════════════════════════════════════════════════
🌀 ÓRBITA ±3 DO SORTEIO ANTERIOR:
═══════════════════════════════════════════════════════════════
- Para cada número X do sorteio anterior, considere X±1, X±2, X±3
- ⛔ PROIBIDO usar X exato!
- Mínimo 4 números na órbita

═══════════════════════════════════════════════════════════════
📝 FORMATO DE RESPOSTA OBRIGATÓRIO:
═══════════════════════════════════════════════════════════════

**NÚMEROS: XX, XX, XX, XX, XX, XX**

═══════════════════════════════════════════════════════════════
🌌 ANÁLISE SUPREMA v8.0 - POR QUE ESTES NÚMEROS PARA ${nextDrawDate}?
═══════════════════════════════════════════════════════════════

📅 **DATA DO SORTEIO: ${nextDrawDate}**
- Soma dos dígitos: [calcule]
- Número Regente: [X]
- Tesla 3-6-9: [é dia divino ou não?]
- Planeta Regente: [nome do planeta]
- Elemento do Dia: [FOGO/ÁGUA/AR/TERRA]

⚡ **ANÁLISE TESLA 3-6-9:**
- Quais números reduzem a 3: [liste]
- Quais números reduzem a 6: [liste]
- Quais números reduzem a 9: [liste]
- Código Vórtice aplicado: [explique]

⚛️ **ANÁLISE QUÂNTICA:**
- Números quânticos incluídos: [liste e explique]
- Camadas/orbitais representadas: [explique]

🌀 **FIBONACCI & RAZÃO ÁUREA:**
- Números Fibonacci incluídos: [liste]
- Relação com φ (1.618): [explique]

🪐 **CORRESPONDÊNCIAS HERMÉTICAS:**
- Quadrado Mágico usado: [qual planeta]
- Números do quadrado incluídos: [liste]

🜂🜄🜁🜃 **ELEMENTO DOMINANTE:**
- Elemento: [nome]
- Números desse elemento: [liste]

🔯 **NÚMEROS MESTRES:**
- Mestres incluídos: [liste]
- Por que foram escolhidos: [explique]

🔢 **PRIMOS SAGRADOS:**
- Primos incluídos: [liste]
- Significado hermético: [explique]

🕉️ **NÚMEROS VÉDICOS:**
- Derivados de 108/72/49: [liste se houver]

📊 **DISTRIBUIÇÃO FINAL:**
- Baixos (01-20): [X números]
- Médios (21-40): [X números]
- Altos (41-60): [X números]
- Pares: [X] | Ímpares: [X]
- Finais: [liste cada final]

🌀 **ÓRBITA ±3:**
- Números na órbita: [liste cada um e de qual veio]

➕ **SOMA TOTAL:** [XXX] → reduz a [X]

✨ **CONCLUSÃO:** [Explique em 2-3 frases por que este jogo é ideal para a data ${nextDrawDate}, conectando o regente, elemento, Tesla e sistemas sagrados]

⚠️ Análise baseada em física quântica, matemática Tesla, tradições herméticas e correspondências sagradas.`;

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

  const generateSingleGame = async (): Promise<number[]> => {
    const extraDraws = getExtraDrawsData();
    
    const prompt = `TAREFA: Gerar ${game.numbersCount} números para a ${game.name} usando Sistema Supremo v8.0.

REGRAS: ${game.numbersCount} números de ${game.minNumber} a ${game.maxNumber}

DADOS:
- Sorteio anterior: ${previousNumbers.map((n) => formatNumber(parseInt(n))).join(", ")}${extraDraws}
- Data do sorteio: ${nextDrawDate}

APLIQUE: Tesla 3-6-9, Física Quântica, Fibonacci, Hermetismo baseado na data ${nextDrawDate}.
Calcule o Regente do dia e aplique as correspondências.

Retorne APENAS no formato:
**NÚMEROS: XX, XX, XX, XX, XX, XX**`;

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

    if (!resp.ok) throw new Error("Erro ao gerar");
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
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) fullResponse += content;
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    const numbersMatch = fullResponse.match(/\*\*NÚMEROS:\s*([\d,\s]+)\*\*/i);
    if (numbersMatch) {
      return numbersMatch[1]
        .split(",")
        .map((n) => parseInt(n.trim()))
        .filter((n) => !isNaN(n) && n >= game.minNumber && n <= game.maxNumber)
        .slice(0, game.numbersCount);
    }
    
    const regex = /\b(\d{1,2})\b/g;
    const allNumbers = fullResponse.match(regex);
    if (allNumbers) {
      return [...new Set(allNumbers.map((n) => parseInt(n)))]
        .filter((n) => n >= game.minNumber && n <= game.maxNumber)
        .slice(0, game.numbersCount);
    }
    
    return [];
  };

  const generateHybridGame = async () => {
    if (!isValidInput()) {
      toast({
        title: "Dados incompletos",
        description: `Preencha todos os ${game.numbersCount} números e a data.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoadingHybrid(true);
    setHybridProgress(0);
    setResult(null);

    try {
      const games: number[][] = [];
      
      // Generate 3 games
      for (let i = 0; i < 3; i++) {
        setHybridProgress(i + 1);
        const nums = await generateSingleGame();
        if (nums.length === game.numbersCount) {
          games.push(nums);
        }
        // Small delay between requests
        if (i < 2) await new Promise(r => setTimeout(r, 500));
      }

      if (games.length < 2) {
        throw new Error("Não foi possível gerar jogos suficientes");
      }

      // Count frequency of each number
      const frequency: Record<number, number> = {};
      games.flat().forEach(n => {
        frequency[n] = (frequency[n] || 0) + 1;
      });

      // Calculate day regent
      const dateDigits = nextDrawDate.replace(/-/g, "").split("").map(Number);
      let regentSum = dateDigits.reduce((a, b) => a + b, 0);
      while (regentSum > 9 && regentSum !== 11 && regentSum !== 22 && regentSum !== 33) {
        regentSum = regentSum.toString().split("").map(Number).reduce((a, b) => a + b, 0);
      }

      // Score each number with Sistema Supremo v8.0
      const fibonacciNums = [1, 2, 3, 5, 8, 13, 21, 34, 55];
      const teslaNums = [9, 18, 27, 36, 45, 54]; // Reduce to 9
      const quantumNums = [2, 6, 8, 10, 14, 18, 32]; // Orbitals + layers
      const masterNums = [11, 22, 33, 44, 55];
      const sacredPrimes = [31, 37, 41, 43, 47, 53];
      const triangularNums = [3, 6, 10, 15, 21, 28, 36, 45, 55];

      // Determine planet based on regent
      const planetMap: Record<number, string> = {
        1: "Sol", 2: "Lua", 3: "Saturno", 4: "Júpiter", 5: "Marte",
        6: "Sol", 7: "Vênus", 8: "Mercúrio", 9: "Lua", 11: "Uriel", 22: "Caminhos"
      };
      const planet = planetMap[regentSum] || "Sol";

      // Tesla day check
      const isTeslaDay = [3, 6, 9].includes(regentSum);

      const scored = Object.entries(frequency).map(([numStr, freq]) => {
        const num = parseInt(numStr);
        let score = freq * 10; // Base score from frequency
        
        // Bonus for reducing to regent
        let reduced = num;
        while (reduced > 9) {
          reduced = reduced.toString().split("").map(Number).reduce((a, b) => a + b, 0);
        }
        if (reduced === regentSum) score += 8;
        
        // Sistema Supremo v8.0 bonuses
        if (teslaNums.includes(num)) score += 6; // Tesla 3-6-9
        if (fibonacciNums.includes(num)) score += 5; // Fibonacci
        if (quantumNums.includes(num)) score += 4; // Quantum
        if (masterNums.includes(num)) score += 7; // Masters
        if (sacredPrimes.includes(num)) score += 5; // Sacred primes
        if (triangularNums.includes(num)) score += 3; // Triangular
        if (num === 14) score += 8; // Orbital f + Pentagram
        if ([3, 6, 9].includes(reduced)) score += 4; // Reduces to Tesla
        
        return { num, score, freq, reduced };
      });

      // Sort by score and take top numbers
      scored.sort((a, b) => b.score - a.score);
      const hybridNumbers = scored
        .slice(0, game.numbersCount)
        .map(s => s.num)
        .sort((a, b) => a - b);

      // Categorize selected numbers
      const selectedScored = scored.filter(s => hybridNumbers.includes(s.num));
      const teslaIncluded = selectedScored.filter(s => teslaNums.includes(s.num) || [3, 6, 9].includes(s.reduced));
      const fibIncluded = selectedScored.filter(s => fibonacciNums.includes(s.num));
      const quantumIncluded = selectedScored.filter(s => quantumNums.includes(s.num));
      const mastersIncluded = selectedScored.filter(s => masterNums.includes(s.num));
      const primesIncluded = selectedScored.filter(s => sacredPrimes.includes(s.num));

      const sum = hybridNumbers.reduce((a, b) => a + b, 0);
      let sumReduced = sum;
      while (sumReduced > 9) {
        sumReduced = sumReduced.toString().split("").map(Number).reduce((a, b) => a + b, 0);
      }

      // Generate analysis with Sistema Supremo v8.0
      const analysis = `🔮 **JOGO HÍBRIDO SUPREMO v8.0**

═══════════════════════════════════════════════════════════════
📅 **ANÁLISE DA DATA: ${nextDrawDate}**
═══════════════════════════════════════════════════════════════

🔢 **Número Regente:** ${regentSum}
🪐 **Planeta Regente:** ${planet}
⚡ **Dia Tesla:** ${isTeslaDay ? "SIM! Dia Divino 3-6-9" : "Não (mas Tesla aplicado)"}

═══════════════════════════════════════════════════════════════
📊 **JOGOS BASE ANALISADOS:**
═══════════════════════════════════════════════════════════════
${games.map((g, i) => `• Jogo ${i + 1}: ${g.map(n => formatNumber(n)).join(", ")}`).join("\n")}

═══════════════════════════════════════════════════════════════
🏆 **FREQUÊNCIA E PONTUAÇÃO SUPREMA:**
═══════════════════════════════════════════════════════════════
${scored.slice(0, 10).map(s => `• ${formatNumber(s.num)}: ${s.freq}/3 jogos | Score: ${s.score} | Reduz a ${s.reduced}`).join("\n")}

═══════════════════════════════════════════════════════════════
🌌 **ANÁLISE SISTEMA SUPREMO v8.0:**
═══════════════════════════════════════════════════════════════

⚡ **Tesla 3-6-9:** ${teslaIncluded.length > 0 ? teslaIncluded.map(s => formatNumber(s.num)).join(", ") : "Nenhum direto, mas código vórtice aplicado"}
⚛️ **Quânticos:** ${quantumIncluded.length > 0 ? quantumIncluded.map(s => formatNumber(s.num)).join(", ") : "Orbitais indiretamente presentes"}
🌀 **Fibonacci:** ${fibIncluded.length > 0 ? fibIncluded.map(s => formatNumber(s.num)).join(", ") : "Razão áurea aplicada indiretamente"}
🔯 **Mestres:** ${mastersIncluded.length > 0 ? mastersIncluded.map(s => formatNumber(s.num)).join(", ") : "Energia mestre via redução"}
🔢 **Primos Sagrados:** ${primesIncluded.length > 0 ? primesIncluded.map(s => formatNumber(s.num)).join(", ") : "Primalidade distribuída"}

═══════════════════════════════════════════════════════════════
✨ **NÚMEROS SELECIONADOS:** ${hybridNumbers.map(n => formatNumber(n)).join(", ")}
═══════════════════════════════════════════════════════════════

➕ **Soma:** ${sum} → reduz a ${sumReduced}

📝 **Por que estes números para ${nextDrawDate}?**
Este jogo combina as âncoras mais consistentes das 3 gerações quânticas. O Regente ${regentSum} (${planet}) harmoniza com os números que reduzem a ele. ${isTeslaDay ? "Por ser dia Tesla (3-6-9), priorizamos múltiplos de 9." : "O código Tesla 3-6-9 foi aplicado para equilibrar as energias."} Os sistemas Quântico, Fibonacci e Hermético convergem para esta combinação ideal.`;

      setResult({
        numbers: hybridNumbers,
        analysis,
        isHybrid: true,
        sourceGames: games,
      });

      toast({ title: "Jogo Híbrido gerado! 🔮" });
    } catch (error) {
      console.error("Hybrid generation error:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao gerar jogo híbrido",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHybrid(false);
      setHybridProgress(0);
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="text-foreground font-medium">
            Números do Sorteio Anterior ({game.numbersCount} números)
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchLastDraw}
            disabled={isLoadingLastDraw}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            {isLoadingLastDraw ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isLoadingLastDraw ? "Buscando..." : "Preencher Último Sorteio"}
          </Button>
        </div>
        
        {lastDrawInfo && (
          <p className="text-xs text-muted-foreground">
            Concurso {lastDrawInfo.drawNumber} • {lastDrawInfo.drawDate}
          </p>
        )}
        
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

      {/* Generate Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={generateNumbers}
          disabled={isLoading || isLoadingHybrid || !isValidInput()}
          className={cn(
            "flex-1 h-12 font-semibold text-base shadow-lg",
            `bg-gradient-to-r ${game.color} hover:opacity-90 text-white`
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Jogo
            </>
          )}
        </Button>
        
        <Button
          onClick={generateHybridGame}
          disabled={isLoading || isLoadingHybrid || !isValidInput()}
          variant="outline"
          className="flex-1 h-12 font-semibold text-base border-cosmic-purple/50 text-cosmic-purple hover:bg-cosmic-purple/10"
        >
          {isLoadingHybrid ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando {hybridProgress}/3...
            </>
          ) : (
            <>
              <Layers className="w-5 h-5 mr-2" />
              Jogo Híbrido
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          {/* Generated Numbers */}
          <div className={cn(
            "p-6 rounded-xl border",
            result.isHybrid 
              ? "bg-gradient-to-br from-cosmic-purple/20 to-gold/20 border-cosmic-purple/30"
              : `bg-gradient-to-br ${game.color}/20 border-white/20`
          )}>
            <p className="text-sm text-muted-foreground mb-3 text-center">
              {result.isHybrid ? "🔮 Jogo Híbrido" : game.icon} {result.isHybrid ? "Combinação Quântica" : `Números Gerados para ${game.name}`}
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
                drawDate={nextDrawDate.split("-").reverse().join("/")}
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
