import { Button } from '@/components/ui/8bit/button.jsx';
import { getSpiritStones } from '../persistence.js';
import { TEXT } from '../ui/strings.js';

// technical.md 5.1 : écran d'accueil, point central du jeu, accessible uniquement après la
// première victoire. Solde de Spirit Stones en haut à droite (rules.md 11.3) et trois boutons.
// « Partir en guerre » est désactivé tant que son contenu n'est pas spécifié ; « Invocation »
// l'est jusqu'à l'arrivée de SummonScreen (roadmap-mvp.md, étape 5).
export default function HomeScreen({ playerFaction, onOpenCivilization }) {
  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center gap-10 bg-neutral-900 text-white">
      <p className="retro absolute top-4 right-6 text-sm">{TEXT.spiritStones(getSpiritStones())}</p>
      <p>{TEXT.playingAs[playerFaction]}</p>
      <div className="flex flex-col gap-6">
        <Button disabled>{TEXT.home.goToWar}</Button>
        <Button onClick={onOpenCivilization}>{TEXT.home.civilization}</Button>
        <Button disabled>{TEXT.home.summon}</Button>
      </div>
    </div>
  );
}
