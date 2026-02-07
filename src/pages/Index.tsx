import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSessionProtection } from "@/hooks/useSessionProtection";
import { useSubscription } from "@/hooks/useSubscription";
import { NumberOrb } from "@/components/NumberOrb";
import { AnalysisCard } from "@/components/AnalysisCard";
import { StatRow } from "@/components/StatRow";
import { NumerologyBadge } from "@/components/NumerologyBadge";
import { DistributionBar } from "@/components/DistributionBar";
import { QuantumOracle } from "@/components/QuantumOracle";
import { LotteryTabs } from "@/components/LotteryTabs";
import { UserMenu } from "@/components/UserMenu";
import { BarChart3, Hash, Sparkles, Target, TrendingUp, Zap, Atom, Dices, Loader2, ShieldX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const drawnNumbers = [5, 14, 22, 31, 47, 53];
const drawDate = "06/01/2026";
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
  { number: 5, meaning: "Movimento & Liberdade", description: "Energia dinâmica e mudança. Rompe estagnação e traz aventura." },
  { number: 14, meaning: "Temperança Arcana", description: "Reduz a 5 (1+4). Equilíbrio entre extremos, moderação criativa." },
  { number: 22, meaning: "Número Mestre Construtor", description: "O mais poderoso. Manifesta sonhos em realidade concreta." },
  { number: 31, meaning: "Criatividade Pioneira", description: "Reduz a 4 (3+1). Construção com originalidade e liderança." },
  { number: 47, meaning: "Sabedoria Oculta", description: "Reduz a 11→2. Intuição aguçada, parcerias e cooperação." },
  { number: 53, meaning: "Transformação Dinâmica", description: "Reduz a 8 (5+3). Poder, abundância e ciclos de karma." },
];

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { subscription, loading: subLoading, hasAccess } = useSubscription();
  
  // Session protection - limits to 1 device at a time
  useSessionProtection(user?.id ?? null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Block access if no active subscription
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Acesso Bloqueado
          </h1>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/30 mb-6 text-left">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              {subscription?.status === "expired" ? (
                <p className="text-sm text-muted-foreground">
                  Sua assinatura expirou em{" "}
                  <span className="text-foreground font-medium">
                    {subscription.expires_at
                      ? new Date(subscription.expires_at).toLocaleDateString("pt-BR")
                      : "data desconhecida"}
                  </span>
                  . Renove para continuar usando o app.
                </p>
              ) : subscription?.status === "cancelled" ? (
                <p className="text-sm text-muted-foreground">
                  Sua assinatura foi cancelada. Entre em contato para reativar.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Você ainda não possui uma assinatura ativa. Adquira seu acesso para usar o Oráculo Quântico.
                </p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => window.open("https://hotmart.com/seu-produto", "_blank")}
              className="w-full gradient-gold text-primary-foreground"
            >
              Adquirir Assinatura
            </Button>
            <Button
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              variant="outline"
              className="w-full"
            >
              Sair
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Se você já comprou, aguarde alguns minutos para a ativação automática.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-3 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Bar with User Menu */}
        <div className="flex justify-end mb-4 sm:mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <UserMenu />
        </div>

        {/* Header */}
        <header className="text-center mb-8 sm:mb-16 opacity-0 animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
          <p className="text-gold/80 font-mono text-xs sm:text-sm tracking-widest uppercase mb-2 sm:mb-3">
            Oráculo Quântico de Loterias
          </p>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-2 sm:mb-4">
            Inteligência <span className="text-gold">Quântica</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto px-2">
            Análise estatística, numerologia cabalística e mapa astral
          </p>
        </header>

        {/* Drawn Numbers Display */}
        <section className="mb-8 sm:mb-16">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 lg:gap-6">
            {drawnNumbers.map((num, idx) => (
              <NumberOrb key={num} number={num} delay={idx * 150} size="responsive" />
            ))}
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Statistical Analysis */}
          <AnalysisCard
            title="Análise Estatística"
            icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />}
            delay={100}
          >
            <div className="space-y-3 sm:space-y-4">
              <StatRow label="Soma Total" value={sum} highlight icon="Σ" />
              <StatRow label="Média" value={(sum / 6).toFixed(1)} icon="μ" />
              <StatRow label="Ímpares" value={`${oddNumbers.length} (${oddNumbers.join(", ")})`} icon="⊙" />
              <StatRow label="Pares" value={`${evenNumbers.length} (${evenNumbers.join(", ")})`} icon="◎" />
              <StatRow label="Sequências" value="Nenhuma" icon="→" />
            </div>
          </AnalysisCard>

          {/* Pattern Analysis */}
          <AnalysisCard
            title="Padrões Identificados"
            icon={<Target className="w-4 h-4 sm:w-5 sm:h-5" />}
            delay={200}
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="p-2 sm:p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Finais Únicos</p>
                <p className="font-mono text-sm sm:text-base text-foreground">
                  Todos finais diferentes: <span className="text-gold">5, 4, 2, 1, 7, 3</span>
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Distribuição</p>
                <p className="text-sm sm:text-base text-foreground">3 ímpares / 3 pares — padrão equilibrado 3×3</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-gold/10 border border-gold/30">
                <p className="text-xs sm:text-sm text-gold/80 mb-1">Diagnóstico</p>
                <p className="text-sm sm:text-base text-foreground">Jogo bem distribuído, anti-padrão popular</p>
              </div>
            </div>
          </AnalysisCard>
        </div>

        {/* Distribution */}
        <AnalysisCard
          title="Distribuição por Faixa"
          icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
          delay={300}
          className="mb-8 sm:mb-12"
        >
          <DistributionBar ranges={ranges} />
        </AnalysisCard>

        {/* Numerology Section */}
        <section className="mb-8 sm:mb-12">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cosmic-purple" />
            <h2 className="font-display text-xl sm:text-3xl font-semibold text-foreground">Leitura Cabalística</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          icon={<Hash className="w-4 h-4 sm:w-5 sm:h-5" />}
          variant="mystic"
          delay={1000}
          className="mb-8 sm:mb-12"
        >
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-2 sm:py-4">
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-display font-bold text-foreground">{sum}</p>
              <p className="text-xs text-muted-foreground mt-1">Soma</p>
            </div>
            <span className="text-xl sm:text-2xl text-muted-foreground">→</span>
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-display font-bold text-foreground">{reducedSum}</p>
              <p className="text-xs text-muted-foreground mt-1">1ª Redução</p>
            </div>
            <span className="text-xl sm:text-2xl text-muted-foreground">→</span>
            <div className="text-center">
              <p className="text-3xl sm:text-5xl font-display font-bold text-cosmic-purple">{finalReduction}</p>
              <p className="text-xs text-muted-foreground mt-1">Número Final</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-cosmic-purple/10 border border-cosmic-purple/30 text-center">
            <p className="text-sm sm:text-base text-cosmic-purple font-semibold">Número {finalReduction} = {finalReduction === 1 ? "Novo Início, Liderança" : finalReduction === 4 ? "Estrutura, Fundação, Trabalho" : finalReduction === 1 + 7 ? "Espiritualidade" : "Transformação"}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Soma 172 → vibração 1: energia de novos começos.
            </p>
          </div>
        </AnalysisCard>

        {/* Conclusion */}
        <AnalysisCard
          title="Conclusão"
          icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
          variant="highlight"
          delay={1100}
        >
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="p-2 sm:p-4">
              <p className="text-lg sm:text-3xl font-display font-bold text-gold mb-1 sm:mb-2">Equilibrado</p>
              <p className="text-xs sm:text-sm text-muted-foreground">3 pares / 3 ímpares</p>
            </div>
            <div className="p-2 sm:p-4">
              <p className="text-lg sm:text-3xl font-display font-bold text-gold mb-1 sm:mb-2">Espalhado</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Todas faixas</p>
            </div>
            <div className="p-2 sm:p-4">
              <p className="text-lg sm:text-3xl font-display font-bold text-gold mb-1 sm:mb-2">Anti-Padrão</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Sem sequências</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/30 text-center">
            <p className="text-foreground font-mono text-xs sm:text-sm">
              "Distribuição ideal para menos divisão de prêmio."
            </p>
          </div>
        </AnalysisCard>

        {/* Lottery Games Generator */}
        <section className="mb-8 sm:mb-12">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "1100ms", animationFillMode: "forwards" }}>
            <Dices className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
            <h2 className="font-display text-xl sm:text-3xl font-semibold text-foreground">Gerador Quântico</h2>
          </div>
          <div className="opacity-0 animate-fade-in" style={{ animationDelay: "1200ms", animationFillMode: "forwards" }}>
            <LotteryTabs />
          </div>
        </section>

        {/* Quantum Oracle */}
        <section className="mb-8 sm:mb-12">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "1300ms", animationFillMode: "forwards" }}>
            <Atom className="w-5 h-5 sm:w-6 sm:h-6 text-cosmic-purple" />
            <h2 className="font-display text-xl sm:text-3xl font-semibold text-foreground">Oráculo Quântico</h2>
          </div>
          <div className="opacity-0 animate-fade-in" style={{ animationDelay: "1400ms", animationFillMode: "forwards" }}>
            <QuantumOracle />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 sm:mt-16 text-center opacity-0 animate-fade-in space-y-2 sm:space-y-3 pb-6" style={{ animationDelay: "1500ms", animationFillMode: "forwards" }}>
          <p className="text-muted-foreground text-xs sm:text-sm px-2">
            Análise simbólica não constitui previsão. Números sorteados em {drawDate}.
          </p>
          <p className="text-gold/80 text-xs sm:text-sm font-medium">
            Desenvolvido por <span className="text-gold">Uriel da Fonseca Fortunato</span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
