import { forwardRef } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { cn } from '@/lib/utils';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import {
  healthBarColor, woundedHpColor, cssColor,
} from '../renderConstants.js';
import { TEXT, unitName } from './strings.js';

// Fafnir a deux valeurs de dégâts (distance / corps-à-corps, units.md).
function formatDamage(damage) {
  return typeof damage === 'number' ? damage : `${damage.ranged}/${damage.melee}`;
}

// ui-battle-screen-decisions.md 2.2 : colonne 1 = copies + sprite (+ mini barre de vie si
// blessé) ; colonne 2 = nom + coût, puis PV/ATK et keywords (retour à la ligne automatique).
// forwardRef : sert de déclencheur au tooltip "budget insuffisant" (DeploymentList).
const UnitRow = forwardRef(({ row, className, ...props }, ref) => {
  const ratio = row.hp / row.maxHp;
  const keywords = row.keywords.length > 0 ? row.keywords : ['basic'];
  return (
    <div
      ref={ref}
      // Repère de la main du tutoriel : l'unité basique de la faction (Lambton / Skeleton).
      data-tutorial={row.keywords.length === 0 ? 'basic-unit' : undefined}
      {...props}
      className={cn(
        'flex gap-3 items-center p-2 border-2 border-foreground/40 bg-neutral-900 select-none touch-none',
        row.deployable ? 'cursor-grab hover:border-foreground' : 'opacity-40 grayscale cursor-not-allowed',
        className,
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        <span className="retro text-xs w-8 text-right">{row.count}x</span>
        <div className="flex flex-col items-center gap-1">
          <img
            src={spritePath(SPECIES_SPRITES[row.species.name].key)}
            alt=""
            draggable={false}
            className="pixelated size-12 object-contain"
          />
          {row.wounded && (
            <div className="w-10 h-1.5 bg-black">
              <div className="h-full" style={{ width: `${ratio * 100}%`, background: cssColor(healthBarColor(ratio)) }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 min-w-0 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-bold">{unitName(row.species)}</span>
          <Badge data-tutorial="presence-tag" className="text-[10px] mx-1.5">{TEXT.presenceTag(row.cost)}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            ♥ <span style={row.wounded ? { color: cssColor(woundedHpColor(ratio)) } : undefined}>{row.hp}</span>/{row.maxHp}
          </span>
          <span>⚔ {formatDamage(row.damage)}</span>
          {keywords.map((keyword) => (
            <Badge key={keyword} variant="secondary" font="normal" className="text-[10px] mx-1.5">
              {TEXT.keywords[keyword]}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
});

export default UnitRow;
