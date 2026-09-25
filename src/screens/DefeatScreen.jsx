import { Button } from '@/components/ui/8bit/button.jsx';

// technical.md 5.3 : squelette minimal, même principe que VictoryScreen. "Réessayer" relance
// la même bataille — la faction déjà choisie n'est jamais redemandée (5.1). Sert aussi au match
// nul (rules.md 8.1) : aucun vainqueur, donc même suite qu'une défaite.
export default function DefeatScreen({ isDraw, onRetry }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 bg-neutral-900 text-white">
      <h1 className="text-3xl font-bold">{isDraw ? 'Match nul' : 'Défaite'}</h1>
      <Button variant="destructive" onClick={onRetry}>Réessayer</Button>
    </div>
  );
}
