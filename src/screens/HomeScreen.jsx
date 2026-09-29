import { useState } from 'react';
import { Button } from '@/components/ui/8bit/button.jsx';
import { playerProgress } from '../logic/levels.js';
import { getPlayerXp, getSpiritStones, saveSpiritStones } from '../persistence.js';
import { LevelBadge, XpBar } from '../ui/LevelDisplay.jsx';
import SpiritFountain from '../ui/SpiritFountain.jsx';
import SpiritStonesBalance from '../ui/SpiritStonesBalance.jsx';
import { TEXT } from '../ui/strings.js';

// technical.md 5.1 : écran d'accueil, point central du jeu, accessible uniquement après la
// première victoire. Solde de Spirit Stones en haut à droite (rules.md 11.3), niveau du joueur
// et sa barre d'XP juste en dessous (rules.md 11.5), trois boutons — « Partir en guerre »
// (WarScreen), gestion de civilisation, invocation — et la Spirit Fountain (rules.md 11.8).
export default function HomeScreen({
  playerFaction, onOpenWar, onOpenCivilization, onOpenSummon,
}) {
  const [spiritStones, setSpiritStones] = useState(getSpiritStones);
  const progress = playerProgress(getPlayerXp());

  const collect = (amount) => {
    const balance = getSpiritStones() + amount;
    saveSpiritStones(balance);
    setSpiritStones(balance);
  };

  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center gap-10 bg-neutral-900 text-white">
      <SpiritStonesBalance amount={spiritStones} />
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
        <Button onClick={onOpenWar}>{TEXT.home.goToWar}</Button>
        <Button onClick={onOpenCivilization}>{TEXT.home.civilization}</Button>
        <Button onClick={onOpenSummon}>{TEXT.home.summon}</Button>
      </div>
      <SpiritFountain playerLevel={progress.level} onHarvest={collect} />
    </div>
  );
}
