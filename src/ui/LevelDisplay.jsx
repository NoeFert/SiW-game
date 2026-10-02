import { Badge } from '@/components/ui/8bit/badge.jsx';
import PixelBar from './PixelBar.jsx';
import { TEXT } from './strings.js';

// GRAPHICS.md « Niveaux » : badge et barre d'XP dans la couleur signature de la faction du joueur.
// `label` : texte du badge (« niv 3 » par défaut ; « Niveau 3 » pour le joueur).
export function LevelBadge({
  level, faction, label = TEXT.levels.badge(level), className = '',
}) {
  return <Badge variant={faction} className={`text-[10px] mx-1.5 ${className}`}>{label}</Badge>;
}

// `progress` : { xpInLevel, xpForLevel, isMax } (voir levels.js). Au niveau maximum d'un
// individu, barre pleine et « MAX » (technical.md 5.1).
export function xpText(progress) {
  return progress.isMax ? TEXT.levels.max : TEXT.levels.xp(progress.xpInLevel, progress.xpForLevel);
}

// `label` : texte à droite de la barre (l'XP par défaut ; le niveau pour le joueur sur l'accueil).
export function XpBar({
  progress, faction, label = xpText(progress), className = '',
}) {
  const ratio = progress.isMax ? 1 : progress.xpInLevel / progress.xpForLevel;
  return (
    <div className={`flex items-center gap-2 text-[10px] ${className}`}>
      <PixelBar ratio={ratio} faction={faction} className="flex-1 min-w-12" />
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}
