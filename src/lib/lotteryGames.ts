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
    id: "quina",
    name: "Quina",
    shortName: "Quina",
    numbersCount: 5,
    maxNumber: 80,
    minNumber: 1,
    color: "from-purple-500 to-purple-700",
    icon: "🎯",
    description: "5 números de 01 a 80",
  },
  {
    id: "lotofacil",
    name: "Lotofácil",
    shortName: "Lotofácil",
    numbersCount: 15,
    maxNumber: 25,
    minNumber: 1,
    color: "from-pink-500 to-pink-700",
    icon: "🎲",
    description: "15 números de 01 a 25",
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
    id: "lotomania",
    name: "Lotomania",
    shortName: "Lotomania",
    numbersCount: 50,
    maxNumber: 100,
    minNumber: 0,
    color: "from-orange-500 to-orange-700",
    icon: "🌟",
    description: "50 números de 00 a 99",
  },
];

export const getGameById = (id: string): LotteryGame | undefined => {
  return LOTTERY_GAMES.find((game) => game.id === id);
};
