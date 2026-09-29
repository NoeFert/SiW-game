import { Badge } from '@/components/ui/8bit/badge.jsx';
import { TEXT } from './strings.js';

// GRAPHICS.md « Niveaux » : badge et barre d'XP dans la couleur signature de la faction du joueur.
// Classes littérales (Tailwind ne détecte pas les noms construits dynamiquement).
const BADGE_CLASS = {
  wyrms: 'bg-faction-wyrms border-faction-wyrms text-black',
  undead: 'bg-faction-undead border-faction-undead text-black',
};
const FILL_CLASS = {
  wyrms: 'bg-faction-wyrms',
  undead: 'bg-faction-undead',
};

// `label` : texte du badge (« niv 3 » par défaut ; « Niveau 3 » pour le joueur).
export function LevelBadge({
  level, faction, label = TEXT.levels.badge(level), className = '',
}) {
  return <Badge className={`text-[10px] mx-1.5 ${BADGE_CLASS[faction]} ${className}`}>{label}</Badge>;
}

// `progress` : { xpInLevel, xpForLevel, isMax } (voir levels.js). Au niveau maximum d'un
// individu, barre pleine et « MAX » (technical.md 5.1).
export function XpBar({ progress, faction, className = '' }) {
  const ratio = progress.isMax ? 1 : progress.xpInLevel / progress.xpForLevel;
  return (
    <div className={`flex items-center gap-2 text-[10px] ${className}`}>
      <div className="h-2 flex-1 min-w-12 bg-black/70 border border-white/30">
        <div className={`h-full ${FILL_CLASS[faction]}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="whitespace-nowrap">
        {progress.isMax ? TEXT.levels.max : TEXT.levels.xp(progress.xpInLevel, progress.xpForLevel)}
      </span>
    </div>
  );
}
