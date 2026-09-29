import { Button } from '@/components/ui/8bit/button.jsx';
import { ReportList } from './VictoryScreen.jsx';
import { TEXT } from '../ui/strings.js';

// technical.md 5.3 : squelette minimal, même principe que VictoryScreen. "Réessayer" relance
// la même bataille — la faction déjà choisie n'est jamais redemandée (5.1). Sert aussi au match
// nul (rules.md 8.1) : aucun vainqueur, donc même suite qu'une défaite.
// Après une bataille de « Partir en guerre » (rules.md 11.7, `lost` fourni) : liste des unités
// perdues, bouton « Retour à l'accueil » (`onHome`), et « Réessayer » désactivé si l'armée est
// vide (`canRetry`).
export default function DefeatScreen({
  isDraw, onRetry, lost = null, onHome = null, canRetry = true,
}) {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center gap-8 py-8 bg-neutral-900 text-white">
      <h1 className="text-3xl font-bold">{isDraw ? TEXT.defeat.draw : TEXT.defeat.title}</h1>
      {lost && (lost.length > 0
        ? <ReportList title={TEXT.report.lost} rows={lost} count={(row) => row.lost} lost />
        : <p className="retro text-xs">{TEXT.report.noLosses}</p>)}
      <div className="flex gap-6">
        <Button variant="destructive" disabled={!canRetry} onClick={onRetry}>{TEXT.defeat.retry}</Button>
        {onHome && <Button onClick={onHome}>{TEXT.defeat.home}</Button>}
      </div>
    </div>
  );
}
