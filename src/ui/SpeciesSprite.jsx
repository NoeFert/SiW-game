import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';

export default function SpeciesSprite({ species, className }) {
  return (
    <img
      src={spritePath(SPECIES_SPRITES[species.name].key)}
      alt=""
      className={`pixelated object-contain ${className}`}
    />
  );
}

// Une ligne « 8x [sprite] … » (bilans de victoire et de défaite, invocation) ; `children` suit
// le sprite.
export function SpeciesCountRow({
  count, species, spriteClassName = 'size-10', className = '', children,
}) {
  return (
    <div className={`flex items-center gap-3 border-2 border-white/30 bg-black/40 px-3 py-2 ${className}`}>
      <span className="retro text-xs w-8 text-right">{count}x</span>
      <SpeciesSprite species={species} className={spriteClassName} />
      {children}
    </div>
  );
}
