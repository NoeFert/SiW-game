import { Button } from '@/components/ui/8bit/button.jsx';
import { ROSTERS } from '../data/rosters.js';
import { SPECIES_SPRITES, SOVEREIGN_SPRITES, spritePath } from '../data/sprites.js';
import { TEXT, unitName } from '../ui/strings.js';

// Une colonne par faction : le souverain en fond, le bouton de choix, puis une rangée de 3
// cases avec les monstres du roster (units.md, dans l'ordre basique / [Vol] / [Légendaire]).
function FactionColumn({ faction, onChoose }) {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center gap-8 overflow-hidden">
      <img
        src={spritePath(SOVEREIGN_SPRITES[faction])}
        alt=""
        className="pixelated absolute inset-0 m-auto h-full max-h-[90%] w-auto object-contain opacity-40 pointer-events-none"
      />
      <Button onClick={() => onChoose(faction)} className="relative text-sm px-8">
        {TEXT.factions[faction]}
      </Button>
      <div className="relative grid grid-cols-3 gap-2">
        {Object.values(ROSTERS[faction]).map((species) => (
          <div key={species.name} className="size-20 border-4 border-white/70 bg-black/60 flex items-center justify-center">
            <img
              src={spritePath(SPECIES_SPRITES[species.name].key)}
              alt={unitName(species)}
              title={unitName(species)}
              className="pixelated size-16 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// technical.md 5.1 : affiché une seule fois, au tout début d'une partie. Purement React, aucune
// dépendance à Phaser (rules.md 9 : le choix détermine le roster joué et celui de l'IA).
export default function FactionChoiceScreen({ onChoose }) {
  return (
    <div className="relative h-screen w-screen flex bg-neutral-900 text-white">
      <FactionColumn faction="wyrms" onChoose={onChoose} />
      <div className="w-1 bg-white/20" />
      <FactionColumn faction="undead" onChoose={onChoose} />
      <h1 className="retro absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-3 bg-neutral-900 text-lg whitespace-nowrap pointer-events-none">
        {TEXT.chooseFaction}
      </h1>
    </div>
  );
}
