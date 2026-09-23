import { Button } from '@/components/ui/8bit/button.jsx';

// technical.md 5.1 : affiché une seule fois, au tout début d'une partie. Purement React, aucune
// dépendance à Phaser (rules.md 9 : le choix détermine le roster joué et celui de l'IA).
export default function FactionChoiceScreen({ onChoose }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 bg-neutral-900 text-white">
      <h1 className="text-2xl font-bold">Choisis ta faction</h1>
      <div className="flex gap-6">
        <Button onClick={() => onChoose('wyrms')}>Souveraine des Wyrms</Button>
        <Button onClick={() => onChoose('undead')}>Souverain des Morts-Vivants</Button>
      </div>
    </div>
  );
}
