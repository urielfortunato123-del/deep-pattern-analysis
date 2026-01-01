import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Calendar, ArrowLeft, History } from "lucide-react";
import { getGameById } from "@/lib/lotteryGames";
import { cn } from "@/lib/utils";

interface GeneratedGame {
  id: string;
  game_type: string;
  game_name: string;
  numbers: number[];
  previous_numbers: number[];
  draw_date: string;
  analysis: string | null;
  created_at: string;
}

const Historico = () => {
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<GeneratedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchGames();
    }
  }, [user]);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from("generated_games")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error("Error fetching games:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteGame = async (id: string) => {
    try {
      const { error } = await supabase
        .from("generated_games")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setGames(games.filter((g) => g.id !== id));
      toast({ title: "Jogo removido" });
    } catch (error) {
      console.error("Error deleting game:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o jogo",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <History className="w-8 h-8 text-gold" />
          <h1 className="font-display text-4xl font-bold text-foreground">
            Histórico de Jogos
          </h1>
        </div>

        {games.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Nenhum jogo salvo
            </h2>
            <p className="text-muted-foreground mb-6">
              Gere jogos na página principal para salvá-los aqui
            </p>
            <Button onClick={() => navigate("/")} className="gradient-gold text-primary-foreground">
              Gerar Jogos
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => {
              const gameConfig = getGameById(game.game_type);
              return (
                <div
                  key={game.id}
                  className="glass-card rounded-xl p-6 animate-fade-in"
                  style={{ animationFillMode: "forwards" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{gameConfig?.icon || "🎲"}</span>
                      <div>
                        <h3 className="font-display text-xl font-semibold text-foreground">
                          {game.game_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Sorteio: {formatDate(game.draw_date)} • Gerado: {formatDate(game.created_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGame(game.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {game.numbers.map((num, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          "number-orb-active text-sm font-bold text-gold"
                        )}
                      >
                        {num.toString().padStart(2, "0")}
                      </div>
                    ))}
                  </div>

                  {game.analysis && (
                    <details className="mt-4">
                      <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                        Ver análise completa
                      </summary>
                      <div className="mt-2 p-4 bg-muted/20 rounded-lg text-sm text-foreground/80 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {game.analysis}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historico;
