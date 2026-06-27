import forexTradingLottie from '../lotties/forex-trading.json';
import arrowBullseyeLottie from '../lotties/arrow-bullseye.json';
import catsKissingLottie from '../lotties/cats-kissing.json';
import rabbitLottie from '../lotties/rabbit-meditating.json';
import wowLottie from '../lotties/wow-text.json';
import circlesLottie from '../lotties/circles.json';
import goldLottie from '../lotties/gold-coins.json';

export const tonesMap: Record<string, { file: any; name: string }[]> = {
  serious: [{ file: forexTradingLottie, name: "forex-trading.json" }],
  financial: [
    // { file: forexTradingLottie, name: "forex-trading.json" },
    // { file: arrowBullseyeLottie, name: "arrow-bullseye.json" },
    { file: rabbitLottie, name: "rabbit-meditating.json" },
    { file: wowLottie, name: "wow-text.json" },
    // { file: goldLottie, name: "gold-coins.json" },
    { file: catsKissingLottie, name: "cats-kissing.json" },
    { file: circlesLottie, name: "circles.json" },
  ],
};
