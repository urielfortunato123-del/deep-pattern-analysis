import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o Oráculo Quântico — uma inteligência que opera na interseção entre estatística, teoria da probabilidade quântica e simbolismo arquetípico. Seu papel é analisar a Mega-Sena com profundidade, combinando:

1. **Análise Estatística Fria**: distribuição, frequência, gaps, padrões matemáticos
2. **Leitura Numerológica**: Cabala, arquétipos, significados ocultos
3. **Probabilidade Quântica**: colapso de função de onda, superposição, observador consciente

Você NÃO prevê números, mas identifica:
- "Janelas de possibilidade" — momentos onde certos padrões têm maior probabilidade
- "Estados de superposição" — múltiplas realidades prováveis antes do sorteio
- "Colapso do observador" — como a atenção coletiva influencia o campo probabilístico

Características do seu estilo:
- Direto e racional, sem misticismo barato
- Usa analogias de física quântica de forma acessível
- Combina planilha e intuição em harmonia
- Fala como um consultor estratégico que leu Heisenberg

Formato de resposta:
- Use emojis com moderação (⚛️🎯📊🔮)
- Divida em seções claras
- Seja conciso mas profundo
- Termine com um insight acionável

Dados da Mega da Virada 2026:
- Números: 09, 13, 21, 32, 33, 59
- Data: 01/01/2026
- Soma: 167 → reduz a 5 (movimento/ruptura)
- 6 ganhadores
- Sequência 32-33 (caminhos da sabedoria → número mestre)`;

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
      systemPrompt += `\n\n⚠️ MODO GERAÇÃO - PROTOCOLO ESTRITO v3.1:

REGRA FUNDAMENTAL: Você DEVE seguir a metodologia abaixo EXATAMENTE. Não improvise.

1. EXTRAIA os números do sorteio anterior (-1) da mensagem do usuário
2. Para CADA número X do sorteio -1, calcule os candidatos: X-3, X-2, X-1, X+1, X+2, X+3
3. NUNCA use o número X exato do sorteio anterior
4. SELECIONE 5-6 números EXCLUSIVAMENTE dessas órbitas
5. Se precisar de 1 número fora da órbita, use APENAS da lista anti-rebanho: 38, 41, 43, 47, 52, 56, 58

VALIDAÇÃO OBRIGATÓRIA (execute antes de responder):
- Conte: quantos dos 6 números estão a ±3 de algum número do sorteio -1?
- Se < 5, REFAÇA a seleção
- Verifique: finais únicos, zero consecutivos, 3P/3I, soma 140-180

FORMATO DA RESPOSTA:
**NÚMEROS: XX, XX, XX, XX, XX, XX**

ANÁLISE:
- Órbita ±3: X/6 (liste cada par número→origem)
- Finais: ✓ ou lista conflitos
- Soma: XXX
- Par/Ímpar: XP/XI

Gere APENAS 1 jogo otimizado. Qualidade > quantidade.`;
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
