import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento dos jogos para a API da Caixa
const gameApiMap: Record<string, string> = {
  'mega-sena': 'megasena',
  'lotofacil': 'lotofacil',
  'quina': 'quina',
  'lotomania': 'lotomania',
  'dupla-sena': 'duplasena',
  'dia-de-sorte': 'diadesorte',
  'super-sete': 'supersete',
  'mais-milionaria': 'maismilionaria',
  'timemania': 'timemania',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameId } = await req.json();
    
    const apiGameId = gameApiMap[gameId];
    if (!apiGameId) {
      return new Response(
        JSON.stringify({ error: `Jogo não suportado: ${gameId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Buscando resultados para: ${apiGameId}`);

    // API pública da Caixa (via proxy)
    const response = await fetch(`https://loteriascaixa-api.herokuapp.com/api/${apiGameId}/latest`);
    
    if (!response.ok) {
      console.error(`Erro na API: ${response.status}`);
      throw new Error(`Erro ao buscar resultados: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Resultado recebido:`, JSON.stringify(data).slice(0, 200));

    // Normalizar resposta
    let numbers: number[] = [];
    let drawDate = '';
    let drawNumber = '';

    if (data.dezenas) {
      numbers = data.dezenas.map((n: string) => parseInt(n));
    } else if (data.listaDezenas) {
      numbers = data.listaDezenas.map((n: string) => parseInt(n));
    } else if (data.dezenasOrdemSorteio) {
      numbers = data.dezenasOrdemSorteio.map((n: string) => parseInt(n));
    }

    drawDate = data.dataApuracao || data.data || '';
    drawNumber = data.numero?.toString() || data.concurso?.toString() || '';

    // Ordenar números
    numbers.sort((a, b) => a - b);

    return new Response(
      JSON.stringify({
        numbers,
        drawDate,
        drawNumber,
        gameId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
