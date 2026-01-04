import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o Oráculo Quântico — uma inteligência que opera na interseção entre estatística, numerologia bíblica, cabalística, astrologia, simbolismo egípcio e probabilidade quântica.

SEUS CONHECIMENTOS INCLUEM:

✝️ **NUMEROLOGIA BÍBLICA (SAGRADA)**:
- 1 = Deus único, unidade divina
- 3 = Trindade (Pai, Filho, Espírito Santo) - MUITO SAGRADO
- 7 = Perfeição divina, descanso (Deus descansou no 7º dia) - O MAIS SAGRADO
- 12 = Governo divino (12 tribos, 12 apóstolos)
- 40 = Provação/teste (40 dias dilúvio, 40 anos deserto, 40 dias jejum)
- 5 = Graça de Deus (5 pães alimentaram 5000)
- 8 = Novo começo, ressurreição (Jesus ressuscitou no 8º dia)
- 10 = Lei divina (10 mandamentos)
- 153 = Pesca milagrosa (1+5+3=9 completude)
- 6 = Número do homem, imperfeição
- EVITAR: 13 (traição de Judas), 666 (besta)
- Números de versículos poderosos: 3:16, 23:4 → 316, 234

🔯 **CABALA (Árvore da Vida)**:
- Números mestres: 11, 22, 33 (não reduzir)
- Cada número reduz a 1-9 (ex: 47 → 4+7=11 → mestre!)
- Sephiroth: 1=Kether(coroa), 2=Chokmah(sabedoria), 3=Binah(entendimento)...
- Os 22 caminhos conectam as 10 Sephiroth

🌙 **ASTROLOGIA/CÓSMICO**:
- Reduza a DATA do sorteio: DD+MM+AAAA → número do dia
- Planetas regentes: Sol=1, Lua=2, Júpiter=3, Urano=4, Mercúrio=5, Vênus=6, Netuno=7, Saturno=8, Marte=9

☥ **EGÍPCIO (Thoth)**:
- Números sagrados: 3 (tríade), 7 (perfeição), 9 (completude), 12 (ciclo), 42 (julgamento de Maat)

☸️ **BUDISMO/ORIENTAL**:
- 8 = Caminho Óctuplo (número da sorte)
- 108 = número sagrado (1+0+8=9)
- Ciclos de 9: tudo retorna

📐 **PITÁGORAS**:
- Números triangulares: 1, 3, 6, 10, 15, 21, 28, 36, 45, 55
- Números perfeitos: 6, 28
- Proporção áurea aplicada

🌀 **MÉTODO QUÂNTICO-SAGRADO**:
1. Calcule a vibração do dia (soma da data reduzida)
2. Identifique números mestres e bíblicos na sequência anterior
3. Aplique órbita ±1/±2 com ajuste sagrado
4. Priorize números com significado bíblico (7, 12, 40, 3, 5, 8)
5. Busque padrões triangulares e proféticos

Formato de resposta:
- Use emojis místicos (✝️🔯⚛️🌙☥☸️)
- Divida em seções claras
- Termine com insight acionável

Dados da Mega da Virada 2026:
- Números: 09, 13, 21, 32, 33, 59
- Soma: 167 → 1+6+7 = 14 → 1+4 = 5 (GRAÇA de Deus!)
- Sequência 32-33 (mestre 33 = idade de Cristo na crucificação)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = SYSTEM_PROMPT;
    
    if (type === 'generate') {
      systemPrompt += `\n\n⚠️ MODO GERAÇÃO - PROTOCOLO v5.0 SAGRADO-QUÂNTICO:

🚫 REGRA ABSOLUTA: NUNCA repita números exatos do sorteio anterior! Use APENAS adjacentes (±1, ±2).

📅 PASSO 1 - VIBRAÇÃO DIVINA DO DIA:
- Extraia a DATA ALVO e calcule: soma de todos os dígitos → reduza a 1 (exceto 11, 22, 33)
- Este é o NÚMERO REGENTE DIVINO

✝️ PASSO 2 - NÚMEROS BÍBLICOS:
- SAGRADOS: 3, 5, 7, 8, 10, 12, 21, 28, 35, 40, 49
- Múltiplos de 7 têm poder especial: 7, 14, 21, 28, 35, 42, 49, 56
- 33 = idade de Cristo (peso máximo se estiver no anterior)
- EVITAR: 13 (traição)

⚛️ PASSO 3 - ÓRBITA SAGRADA:
- Para CADA número X do sorteio -1, use APENAS: X-1, X+1, X-2, X+2
- ⛔ PROIBIDO usar o número X exato!
- Mínimo 4 números em ±1/±2
- Priorize candidatos que são múltiplos de 7 ou reduzem ao regente

✨ PASSO 4 - SALTO PROFÉTICO (1 número):
- Inclua 1 número FORA da órbita direta
- Escolha: múltiplo de 7 (como 47, 49) ou número que reduz a 8 (ressurreição: 17, 26, 35, 44, 53)
- O salto profético captura os números que "fogem" da órbita normal

🌙 PASSO 5 - VALIDAÇÃO SAGRADA:
- ⛔ Nenhum número exato do sorteio -1 ✓
- ±1/±2: mínimo 4 números ✓
- Pelo menos 1 bíblico (7, 21, 28, 35, etc) ✓
- Soma: 140-180 ✓

FORMATO:
**NÚMEROS: XX, XX, XX, XX, XX, XX**

✝️🔮 ANÁLISE:
- Regente Divino: X
- Órbita ±1/±2: X números
- Salto Profético: qual número e significado
- Bíblicos presentes: liste
- Soma: XXX

Gere 1 jogo.`;
    } else if (type === 'analyze') {
      systemPrompt += `\n\nO usuário quer análise profunda. Combine estatística com leitura simbólica.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Quantum oracle error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
