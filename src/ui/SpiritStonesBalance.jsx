import { TEXT } from './strings.js';

// rules.md 11.3 : solde de Spirit Stones, en haut à droite (HomeScreen et SummonScreen).
export default function SpiritStonesBalance({ amount }) {
  return <p className="retro absolute top-4 right-6 text-sm">{TEXT.spiritStones(amount)}</p>;
}
