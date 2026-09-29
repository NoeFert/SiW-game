import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/8bit/card.jsx';
import { ROSTERS } from '../data/rosters.js';
import { countUnitsBySpecies } from '../logic/civilization.js';
import { getOwnedUnits } from '../persistence.js';

// technical.md 5.1 : lecture seule en v1 — une ligne par espèce du roster (units.md), avec les
// individus possédés par espèce (rules.md 11.1, persistence.js).
export default function CivilizationScreen({ playerFaction, onBack }) {
  const ownedCopies = countUnitsBySpecies(ROSTERS[playerFaction], getOwnedUnits() ?? []);

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
              <span>{ownedCopies[key]}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Button onClick={onBack}>Retour</Button>
    </div>
  );
}
