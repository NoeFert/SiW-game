import { Button } from '@/components/ui/8bit/button.jsx';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import { TEXT, unitName } from '../ui/strings.js';

// Une ligne du bilan : "8x [sprite] Ver de Lambton". Les unités perdues sont grisées.
function ReportList({ title, rows, count, lost }) {
  return (
    <section className="flex flex-col gap-3 w-80">
      <h2 className="retro text-xs">{title}</h2>
      {rows.map((row) => (
        <div
          key={row.species.name}
          className={`flex items-center gap-3 border-2 border-white/30 bg-black/40 px-3 py-2 ${lost ? 'opacity-60 grayscale' : ''}`}
        >
          <span className="retro text-xs w-8 text-right">{count(row)}x</span>
          <img
            src={spritePath(SPECIES_SPRITES[row.species.name].key)}
            alt=""
            className="pixelated size-10 object-contain"
          />
          <span className="text-sm">{unitName(row.species)}</span>
        </div>
      ))}
    </section>
  );
}

// technical.md 5.3 : squelette minimal — le contenu de récompense réel est hors scope v1
// (roadmap.md). technical.md 5.6 : en version clickbait, `report` (getCasualtyReport) affiche
// les unités perdues, pour faire sentir le poids des pertes. Sans `report` (jeu normal),
// l'écran reste un simple titre + bouton.
export default function VictoryScreen({ onContinue, report }) {
  const lost = report?.filter((row) => row.lost > 0) ?? [];

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center gap-8 py-8 bg-neutral-900 text-white">
      <h1 className="text-3xl font-bold">Victoire</h1>
      {report && (lost.length > 0
        ? <ReportList title={TEXT.report.lost} rows={lost} count={(row) => row.lost} lost />
        : <p className="retro text-xs">{TEXT.report.noLosses}</p>)}
      <Button onClick={onContinue}>Continuer</Button>
    </div>
  );
}
