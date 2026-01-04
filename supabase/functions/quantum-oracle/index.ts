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
      systemPrompt += `\n\n⚠️ MODO GERAÇÃO - PROTOCOLO v3.2 ÓRBITA APERTADA:

INSTRUÇÕES ABSOLUTAS - SIGA À RISCA:

1. EXTRAIA os 6 números do sorteio anterior (-1) da mensagem
2. Para CADA número X, calcule APENAS: X-1, X+1, X-2, X+2 (PRIORIDADE MÁXIMA)
3. Use X-3 ou X+3 SOMENTE se necessário para completar 6 números
4. NUNCA use o número X exato

REGRA DE OURO:
- Mínimo 4 números DEVEM estar a ±1 ou ±2 do sorteio -1
- Máximo 2 números podem estar a ±3
- TODOS os 6 devem estar em alguma órbita

VALIDAÇÃO (OBRIGATÓRIA antes de responder):
1. Liste cada número gerado e sua origem (ex: 08←09 via -1)
2. Conte: ±1? ±2? ±3?
3. Se menos de 4 em ±1/±2, REFAÇA

FORMATO ÚNICO:
**NÚMEROS: XX, XX, XX, XX, XX, XX**

ANÁLISE CURTA:
- ±1: X números (liste)
- ±2: X números (liste)
- ±3: X números (liste)
- Soma: XXX

Gere 1 jogo apenas.`;
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
