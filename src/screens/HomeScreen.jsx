import { useState } from 'react';
import { Button } from '@/components/ui/8bit/button.jsx';
import { SOVEREIGN_SPRITES, spritePath } from '../data/sprites.js';
import { playerProgress } from '../logic/levels.js';
import { getPlayerXp, getSpiritStones, saveSpiritStones } from '../persistence.js';
import { XpBar, xpText } from '../ui/LevelDisplay.jsx';
import SpiritFountain from '../ui/SpiritFountain.jsx';
import SpiritStonesBalance from '../ui/SpiritStonesBalance.jsx';
import { TEXT } from '../ui/strings.js';

// technical.md 5.1 : écran d'accueil, point central du jeu, accessible uniquement après la
// première victoire. En haut à gauche, le portrait du souverain avec, à sa droite, son nom, sa
// barre d'XP et son niveau (rules.md 11.5) ; solde de Spirit Stones en haut à droite (rules.md
// 11.3) ; quatre boutons — « Partir en guerre » (WarScreen), les unités (bouton au nom de la
// faction) et « Armées » (CivilizationScreen), invocation — et la Spirit Fountain (rules.md 11.8).
export default function HomeScreen({
  playerFaction, onOpenWar, onOpenUnits, onOpenArmy, onOpenSummon,
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
      <div className="absolute top-4 left-6 flex items-center gap-4">
        <div className="pixel-frame size-24">
          <img src={spritePath(SOVEREIGN_SPRITES[playerFaction])} alt="" className="size-full object-contain" />
        </div>
        <div className="flex w-64 flex-col gap-2">
          <span className="retro text-xs">{TEXT.sovereignName[playerFaction]}</span>
          <XpBar
            progress={progress}
            faction={playerFaction}
            label={TEXT.levels.player(progress.level)}
            className="retro"
          />
          <span className="text-[10px] text-white/60">{xpText(progress)}</span>
        </div>
      </div>
      <p>{TEXT.playingAs[playerFaction]}</p>
      <div className="flex flex-col gap-6">
        <Button onClick={onOpenWar}>{TEXT.home.goToWar}</Button>
        <Button onClick={onOpenUnits}>{TEXT.factions[playerFaction]}</Button>
        <Button onClick={onOpenArmy}>{TEXT.home.army}</Button>
        <Button onClick={onOpenSummon}>{TEXT.home.summon}</Button>
      </div>
      <SpiritFountain playerLevel={progress.level} onHarvest={collect} />
    </div>
  );
}
