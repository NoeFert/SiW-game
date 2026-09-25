import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/8bit/card.jsx';
import { ROSTERS } from '../data/rosters.js';
import { getOwnedCopies } from '../persistence.js';

// technical.md 5.1 : lecture seule en v1 — une ligne par espèce du roster (units.md), avec les
// copies encore possédées sur le total initial, telles que figées à la victoire du tutoriel
// (persistence.js). Aucune action hormis le retour vers HomeScreen.
export default function CivilizationScreen({ playerFaction, onBack }) {
  const ownedCopies = getOwnedCopies() ?? {};

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 bg-neutral-900 text-white">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Civilisation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {Object.entries(ROSTERS[playerFaction]).map(([key, species]) => (
            <div key={key} className="flex justify-between gap-4">
              <span>{species.name}</span>
              <span>{ownedCopies[key] ?? species.copies}/{species.copies}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Button onClick={onBack}>Retour</Button>
    </div>
  );
}
