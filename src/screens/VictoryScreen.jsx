import { Button } from '@/components/ui/8bit/button.jsx';

// technical.md 5.3 : squelette minimal — le contenu de récompense réel est hors scope v1
// (roadmap.md). La structure (titre / zone de contenu à venir / action) reste prête à
// accueillir ce contenu plus tard sans réécriture.
export default function VictoryScreen({ onContinue }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 bg-neutral-900 text-white">
      <h1 className="text-3xl font-bold">Victoire</h1>
      <Button onClick={onContinue}>Continuer</Button>
    </div>
  );
}
