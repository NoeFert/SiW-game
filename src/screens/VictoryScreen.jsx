import { Button } from '@/components/ui/8bit/button.jsx';
import { ROSTERS } from '../data/rosters.js';
import { LevelBadge } from '../ui/LevelDisplay.jsx';
import { SpeciesCountRow } from '../ui/SpeciesSprite.jsx';
import { SpiritStonesAmount } from '../ui/SpiritStonesBalance.jsx';
import { TEXT, unitName } from '../ui/strings.js';

// Une ligne du bilan : "8x [sprite] Ver de Lambton". Les unités perdues sont grisées.
// Aussi utilisé par DefeatScreen (pertes d'une défaite de « Partir en guerre »).
export function ReportList({ title, rows, count, lost }) {
  return (
    <section className="flex flex-col gap-3 w-80">
      <h2 className="retro text-xs">{title}</h2>
      {rows.map((row) => (
        <SpeciesCountRow
          key={row.species.name}
          count={count(row)}
          species={row.species}
          className={lost ? 'opacity-60 grayscale' : ''}
        >
          <span className="text-sm">{unitName(row.species)}</span>
        </SpeciesCountRow>
      ))}
    </section>
  );
}

// technical.md 5.3 : jeu normal — XP gagnée par le joueur, puis individus qui ont gagné au
// moins un niveau, regroupés (« 2x [sprite] Ver de Lambton niv 1 → 2 »), bloc absent s'il n'y
// en a aucun (rules.md 11.5 et 11.6).
function ProgressReport({ progress, playerFaction }) {
  const roster = ROSTERS[playerFaction];
  return (
    <>
      <div className="retro flex flex-col items-center gap-3 text-sm">
        <span>{TEXT.levels.xpGained(progress.xpGained)}</span>
        {progress.spiritStonesGained > 0 && <SpiritStonesAmount amount={progress.spiritStonesGained} />}
      </div>
      {progress.levelUps.length > 0 && (
        <section className="flex flex-col gap-3 w-96">
          <h2 className="retro text-xs">{TEXT.levels.levelUps}</h2>
          {progress.levelUps.map(({ species, from, to, count }) => (
            <SpeciesCountRow key={`${species}-${from}-${to}`} count={count} species={roster[species]}>
              <span className="flex-1 text-sm">{unitName(roster[species])}</span>
              <LevelBadge level={to} faction={playerFaction} label={TEXT.levels.levelUp(from, to)} />
            </SpeciesCountRow>
          ))}
        </section>
      )}
    </>
  );
}

// technical.md 5.3 : squelette minimal — la récompense en Spirit Stones reste à définir
// (roadmap-mvp.md). technical.md 5.6 : en version clickbait, `report` (getCasualtyReport)
// affiche les unités perdues, pour faire sentir le poids des pertes. Jeu normal : `progress`
// (resolveVictory) affiche l'XP et les niveaux gagnés.
export default function VictoryScreen({
  onContinue, report, progress, playerFaction,
}) {
  const lost = report?.filter((row) => row.lost > 0) ?? [];

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center gap-8 py-8 bg-neutral-900 text-white">
      <h1 className="text-3xl font-bold">Victoire</h1>
      {report && (lost.length > 0
        ? <ReportList title={TEXT.report.lost} rows={lost} count={(row) => row.lost} lost />
        : <p className="retro text-xs">{TEXT.report.noLosses}</p>)}
      {progress && <ProgressReport progress={progress} playerFaction={playerFaction} />}
      <Button onClick={onContinue}>Continuer</Button>
    </div>
  );
}
