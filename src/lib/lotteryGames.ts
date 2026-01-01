export interface LotteryGame {
  id: string;
  name: string;
  shortName: string;
  numbersCount: number;
  maxNumber: number;
  minNumber: number;
  color: string;
  icon: string;
  description: string;
}

export const LOTTERY_GAMES: LotteryGame[] = [
  {
    id: "mega-sena",
    name: "Mega-Sena",
    shortName: "Mega",
    numbersCount: 6,
    maxNumber: 60,
    minNumber: 1,
    color: "from-green-500 to-green-700",
    icon: "🍀",
    description: "6 números de 01 a 60",
  },
  {
    id: "lotofacil",
    name: "Lotofácil",
    shortName: "Lotofácil",
    numbersCount: 15,
    maxNumber: 25,
    minNumber: 1,
    color: "from-purple-500 to-purple-700",
    icon: "🎲",
    description: "15 números de 01 a 25",
  },
  {
    id: "quina",
    name: "Quina",
    shortName: "Quina",
    numbersCount: 5,
    maxNumber: 80,
    minNumber: 1,
    color: "from-blue-500 to-blue-700",
    icon: "🎯",
    description: "5 números de 01 a 80",
  },
  {
    id: "lotomania",
    name: "Lotomania",
    shortName: "Lotomania",
    numbersCount: 50,
    maxNumber: 99,
    minNumber: 0,
    color: "from-orange-500 to-orange-700",
    icon: "🌟",
    description: "50 números de 00 a 99",
  },
  {
    id: "dupla-sena",
    name: "Dupla Sena",
    shortName: "Dupla",
    numbersCount: 6,
    maxNumber: 50,
    minNumber: 1,
    color: "from-red-500 to-red-700",
    icon: "🎰",
    description: "6 números de 01 a 50",
  },
  {
    id: "mais-milionaria",
    name: "+Milionária",
    shortName: "+Milionária",
    numbersCount: 6,
    maxNumber: 50,
    minNumber: 1,
    color: "from-yellow-500 to-yellow-700",
    icon: "💰",
    description: "6 números de 01 a 50 + 2 trevos",
  },
  {
    id: "dia-de-sorte",
    name: "Dia de Sorte",
    shortName: "Dia de Sorte",
    numbersCount: 7,
    maxNumber: 31,
    minNumber: 1,
    color: "from-cyan-500 to-cyan-700",
    icon: "📅",
    description: "7 números de 01 a 31 + mês",
  },
  {
    id: "timemania",
    name: "Timemania",
    shortName: "Timemania",
    numbersCount: 10,
    maxNumber: 80,
    minNumber: 1,
    color: "from-emerald-500 to-emerald-700",
    icon: "⚽",
    description: "10 números de 01 a 80",
  },
  {
    id: "super-sete",
    name: "Super Sete",
    shortName: "Super 7",
    numbersCount: 7,
    maxNumber: 9,
    minNumber: 0,
    color: "from-pink-500 to-pink-700",
    icon: "7️⃣",
    description: "7 números de 0 a 9 (colunas)",
  },
];

export const getGameById = (id: string): LotteryGame | undefined => {
  return LOTTERY_GAMES.find((game) => game.id === id);
};
