import { NumberOrb } from "@/components/NumberOrb";
import { AnalysisCard } from "@/components/AnalysisCard";
import { StatRow } from "@/components/StatRow";
import { NumerologyBadge } from "@/components/NumerologyBadge";
import { DistributionBar } from "@/components/DistributionBar";
import { QuantumOracle } from "@/components/QuantumOracle";
import { BarChart3, Hash, Sparkles, Target, TrendingUp, Zap, Atom } from "lucide-react";

const drawnNumbers = [9, 13, 21, 32, 33, 59];
const sum = drawnNumbers.reduce((a, b) => a + b, 0);
const reducedSum = sum.toString().split("").reduce((a, b) => a + parseInt(b), 0);
const finalReduction = reducedSum > 9 ? reducedSum.toString().split("").reduce((a, b) => a + parseInt(b), 0) : reducedSum;

const ranges = [
  { label: "01-10", numbers: drawnNumbers.filter((n) => n >= 1 && n <= 10), count: 0 },
  { label: "11-20", numbers: drawnNumbers.filter((n) => n >= 11 && n <= 20), count: 0 },
  { label: "21-30", numbers: drawnNumbers.filter((n) => n >= 21 && n <= 30), count: 0 },
  { label: "31-40", numbers: drawnNumbers.filter((n) => n >= 31 && n <= 40), count: 0 },
  { label: "41-50", numbers: drawnNumbers.filter((n) => n >= 41 && n <= 50), count: 0 },
  { label: "51-60", numbers: drawnNumbers.filter((n) => n >= 51 && n <= 60), count: 0 },
].map((r) => ({ ...r, count: r.numbers.length }));

const oddNumbers = drawnNumbers.filter((n) => n % 2 !== 0);
const evenNumbers = drawnNumbers.filter((n) => n % 2 === 0);

const numerologyData = [
  { number: 9, meaning: "Fechamento Cármico", description: "Último dígito antes do recomeço. Colheita e finalização de ciclos." },
  { number: 13, meaning: "Morte Simbólica", description: "Transformação profunda. Quem ganha não continua a mesma pessoa." },
  { number: 21, meaning: "Coroa Menor", description: "Fechamento perfeito (3×7). Número de sorte pública e manifestação." },
  { number: 32, meaning: "Caminhos da Sabedoria", description: "Na Cabala hebraica, os 32 caminhos estruturam o universo." },
  { number: 33, meaning: "Número Mestre", description: "Consciência elevada. Transição de nível espiritual e material." },
  { number: 59, meaning: "Mudança Definitiva", description: "5 (movimento) + 9 (fechamento). Não há volta — ruptura total." },
];

const Index = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-16 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <p className="text-gold/80 font-mono text-sm tracking-widest uppercase mb-3">
            01 de Janeiro de 2026
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-4">
            Mega da <span className="text-gold">Virada</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Análise estatística e leitura simbólica — razão e arquétipo lado a lado
          </p>
        </header>

        {/* Drawn Numbers Display */}
        <section className="mb-16">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {drawnNumbers.map((num, idx) => (
              <NumberOrb key={num} number={num} delay={idx * 150} />
            ))}
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Statistical Analysis */}
          <AnalysisCard
            title="Análise Estatística"
            icon={<BarChart3 className="w-5 h-5" />}
            delay={100}
          >
            <div className="space-y-4">
              <StatRow label="Soma Total" value={sum} highlight icon="Σ" />
              <StatRow label="Média" value={(sum / 6).toFixed(1)} icon="μ" />
              <StatRow label="Ímpares" value={`${oddNumbers.length} (${oddNumbers.join(", ")})`} icon="⊙" />
              <StatRow label="Pares" value={`${evenNumbers.length} (${evenNumbers.join(", ")})`} icon="◎" />
              <StatRow label="Sequências" value="32-33" highlight icon="→" />
            </div>
          </AnalysisCard>

          {/* Pattern Analysis */}
          <AnalysisCard
            title="Padrões Identificados"
            icon={<Target className="w-5 h-5" />}
            delay={200}
          >
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-sm text-muted-foreground mb-1">Finais Repetidos</p>
                <p className="font-mono text-foreground">
                  Final 9: <span className="text-gold">09, 59</span> · Final 3: <span className="text-gold">13, 33</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-sm text-muted-foreground mb-1">Distribuição</p>
                <p className="text-foreground">5 ímpares / 1 par — fora do padrão 3×3</p>
              </div>
              <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
                <p className="text-sm text-gold/80 mb-1">Diagnóstico</p>
                <p className="text-foreground">Jogo visualmente sedutor, alta chance de múltiplos ganhadores</p>
              </div>
            </div>
          </AnalysisCard>
        </div>

        {/* Distribution */}
        <AnalysisCard
          title="Distribuição por Faixa"
          icon={<TrendingUp className="w-5 h-5" />}
          delay={300}
          className="mb-12"
        >
          <DistributionBar ranges={ranges} />
        </AnalysisCard>

        {/* Numerology Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
            <Sparkles className="w-6 h-6 text-cosmic-purple" />
            <h2 className="font-display text-3xl font-semibold text-foreground">Leitura Cabalística</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {numerologyData.map((item, idx) => (
              <div
                key={item.number}
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${500 + idx * 100}ms`, animationFillMode: "forwards" }}
              >
                <NumerologyBadge
                  number={item.number}
                  meaning={item.meaning}
                  description={item.description}
                  variant={idx % 3 === 0 ? "gold" : idx % 3 === 1 ? "purple" : "teal"}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Sum Reduction */}
        <AnalysisCard
          title="Redução Numerológica"
          icon={<Hash className="w-5 h-5" />}
          variant="mystic"
          delay={1000}
          className="mb-12"
        >
          <div className="flex flex-wrap items-center justify-center gap-4 py-4">
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-foreground">{sum}</p>
              <p className="text-xs text-muted-foreground mt-1">Soma</p>
            </div>
            <span className="text-2xl text-muted-foreground">→</span>
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-foreground">{reducedSum}</p>
              <p className="text-xs text-muted-foreground mt-1">1ª Redução</p>
            </div>
            <span className="text-2xl text-muted-foreground">→</span>
            <div className="text-center">
              <p className="text-5xl font-display font-bold text-cosmic-purple">{finalReduction}</p>
              <p className="text-xs text-muted-foreground mt-1">Número Final</p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-cosmic-purple/10 border border-cosmic-purple/30 text-center">
            <p className="text-cosmic-purple font-semibold">Número 5 = Movimento, Ruptura, Liberdade</p>
            <p className="text-sm text-muted-foreground mt-1">
              Mega da Virada sempre vibra no 5 — o único sorteio pensado para quebrar rotina social.
            </p>
          </div>
        </AnalysisCard>

        {/* Conclusion */}
        <AnalysisCard
          title="Conclusão"
          icon={<Zap className="w-5 h-5" />}
          variant="highlight"
          delay={1100}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <p className="text-3xl font-display font-bold text-gold mb-2">Limpo</p>
              <p className="text-sm text-muted-foreground">Estatisticamente elegante</p>
            </div>
            <div className="p-4">
              <p className="text-3xl font-display font-bold text-gold mb-2">Sedutor</p>
              <p className="text-sm text-muted-foreground">Visualmente atrativo</p>
            </div>
            <div className="p-4">
              <p className="text-3xl font-display font-bold text-gold mb-2">Diluído</p>
              <p className="text-sm text-muted-foreground">6 ganhadores dividem</p>
            </div>
          </div>
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/30 text-center">
            <p className="text-foreground font-mono text-sm">
              "Bom design, alto engajamento, margem unitária menor."
            </p>
          </div>
        </AnalysisCard>

        {/* Quantum Oracle */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "1200ms", animationFillMode: "forwards" }}>
            <Atom className="w-6 h-6 text-cosmic-purple" />
            <h2 className="font-display text-3xl font-semibold text-foreground">Oráculo Quântico</h2>
          </div>
          <div className="opacity-0 animate-fade-in" style={{ animationDelay: "1300ms", animationFillMode: "forwards" }}>
            <QuantumOracle />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center opacity-0 animate-fade-in" style={{ animationDelay: "1400ms", animationFillMode: "forwards" }}>
          <p className="text-muted-foreground text-sm">
            Análise simbólica não constitui previsão. Números sorteados em 01/01/2026.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
