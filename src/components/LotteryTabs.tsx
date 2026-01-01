import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameGenerator } from "@/components/GameGenerator";
import { LOTTERY_GAMES } from "@/lib/lotteryGames";
import { cn } from "@/lib/utils";

export const LotteryTabs = () => {
  const [activeTab, setActiveTab] = useState(LOTTERY_GAMES[0].id);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Headers */}
        <div className="border-b border-border/30 bg-muted/10">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-transparent p-2">
            {LOTTERY_GAMES.map((game) => (
              <TabsTrigger
                key={game.id}
                value={game.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:text-white data-[state=active]:shadow-lg",
                  "data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-muted-foreground",
                  "hover:bg-muted/50",
                  activeTab === game.id && game.color
                )}
              >
                <span className="text-lg">{game.icon}</span>
                <span className="hidden sm:inline">{game.shortName}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Contents */}
        {LOTTERY_GAMES.map((game) => (
          <TabsContent key={game.id} value={game.id} className="p-6 mt-0">
            <div className="mb-6">
              <h3 className="font-display text-2xl font-semibold text-foreground flex items-center gap-3">
                <span className="text-3xl">{game.icon}</span>
                {game.name}
              </h3>
              <p className="text-muted-foreground mt-1">{game.description}</p>
            </div>
            <GameGenerator game={game} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
