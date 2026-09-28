import { Button } from '@/components/ui/8bit/button.jsx';

// technical.md 5.1 : accessible uniquement après la première victoire. Pour la v1, une seule
// ligne de texte suffit — pas de vrai hub à construire tant que le scope reste une bataille.
const FACTION_LABELS = {
  wyrms: 'la Souveraine des Wyrms',
  undead: 'le Souverain des Morts-Vivants',
};

export default function HomeScreen({ playerFaction, onOpenCivilization }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center gap-4 bg-neutral-900 text-white">
      <p>Vous jouez {FACTION_LABELS[playerFaction] ?? playerFaction}.</p>
      <Button onClick={onOpenCivilization}>Civilisation</Button>
    </div>
  );
}
