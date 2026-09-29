import { Button } from '@/components/ui/8bit/button.jsx';
import { getSpiritStones } from '../persistence.js';
import SpiritStonesBalance from '../ui/SpiritStonesBalance.jsx';
import { TEXT } from '../ui/strings.js';

// technical.md 5.1 : écran d'accueil, point central du jeu, accessible uniquement après la
// première victoire. Solde de Spirit Stones en haut à droite (rules.md 11.3) et trois boutons.
// « Partir en guerre » est désactivé tant que son contenu n'est pas spécifié (roadmap-mvp.md).
export default function HomeScreen({ playerFaction, onOpenCivilization, onOpenSummon }) {
  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center gap-10 bg-neutral-900 text-white">
      <SpiritStonesBalance amount={getSpiritStones()} />
      <p>{TEXT.playingAs[playerFaction]}</p>
      <div className="flex flex-col gap-6">
        <Button disabled>{TEXT.home.goToWar}</Button>
        <Button onClick={onOpenCivilization}>{TEXT.home.civilization}</Button>
        <Button onClick={onOpenSummon}>{TEXT.home.summon}</Button>
      </div>
    </div>
  );
}
