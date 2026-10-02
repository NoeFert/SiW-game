import { useState } from 'react';
import '@/components/ui/8bit/styles/pixel-ui.css';
import { SOVEREIGN_SPRITES, spritePath } from '../data/sprites.js';
import { playerProgress } from '../logic/levels.js';
import { getPlayerXp, getSpiritStones, saveSpiritStones } from '../persistence.js';
import { XpBar } from '../ui/LevelDisplay.jsx';
import SpiritFountain from '../ui/SpiritFountain.jsx';
import SpiritStonesBalance from '../ui/SpiritStonesBalance.jsx';
import { TEXT } from '../ui/strings.js';

// GRAPHICS.md « Interface » : entrée de menu sans cadre de bouton, soulignée du séparateur violet.
function MenuItem({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="retro flex flex-col items-end gap-2 text-sm hover:text-violet-300">
      {children}
      <span aria-hidden className="pixel-divider w-full" />
    </button>
  );
}

// technical.md 5.1 : écran d'accueil, point central du jeu, accessible uniquement après la
// première victoire. En haut à gauche, le portrait du souverain avec, à sa droite, son nom, sa
// barre d'XP et son niveau (rules.md 11.5) ; solde de Spirit Stones en haut à droite (rules.md
// 11.3) ; menu de quatre entrées alignées à droite — « Partir en guerre » (WarScreen), les unités
// (entrée au nom de la faction) et « Armées » (CivilizationScreen), invocation — et la Spirit
// Fountain (rules.md 11.8).
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
        </div>
      </div>
      <nav className="absolute right-12 top-1/2 flex -translate-y-1/2 flex-col items-end gap-8">
        <MenuItem onClick={onOpenWar}>{TEXT.home.goToWar}</MenuItem>
        <MenuItem onClick={onOpenUnits}>{TEXT.factions[playerFaction]}</MenuItem>
        <MenuItem onClick={onOpenArmy}>{TEXT.home.army}</MenuItem>
        <MenuItem onClick={onOpenSummon}>{TEXT.home.summon}</MenuItem>
      </nav>
      <SpiritFountain playerLevel={progress.level} onHarvest={collect} />
    </div>
  );
}
