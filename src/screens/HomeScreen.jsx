import { Button } from '@/components/ui/8bit/button.jsx';
import { playerProgress } from '../logic/levels.js';
import { getPlayerXp, getSpiritStones } from '../persistence.js';
import { LevelBadge, XpBar } from '../ui/LevelDisplay.jsx';
import SpiritStonesBalance from '../ui/SpiritStonesBalance.jsx';
import { TEXT } from '../ui/strings.js';

// technical.md 5.1 : écran d'accueil, point central du jeu, accessible uniquement après la
// première victoire. Solde de Spirit Stones en haut à droite (rules.md 11.3), niveau du joueur
// et sa barre d'XP juste en dessous (rules.md 11.5), et trois boutons. « Partir en guerre » est
// désactivé tant que son contenu n'est pas spécifié (roadmap-mvp.md).
export default function HomeScreen({ playerFaction, onOpenCivilization, onOpenSummon }) {
  const progress = playerProgress(getPlayerXp());
  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center gap-10 bg-neutral-900 text-white">
      <SpiritStonesBalance amount={getSpiritStones()} />
      <div className="absolute top-12 right-6 flex w-56 flex-col items-end gap-2">
        <LevelBadge
          level={progress.level}
          faction={playerFaction}
          label={TEXT.levels.player(progress.level)}
          className="retro"
        />
        <XpBar progress={progress} faction={playerFaction} className="w-full" />
      </div>
      <p>{TEXT.playingAs[playerFaction]}</p>
      <div className="flex flex-col gap-6">
        <Button disabled>{TEXT.home.goToWar}</Button>
        <Button onClick={onOpenCivilization}>{TEXT.home.civilization}</Button>
        <Button onClick={onOpenSummon}>{TEXT.home.summon}</Button>
      </div>
    </div>
  );
}
