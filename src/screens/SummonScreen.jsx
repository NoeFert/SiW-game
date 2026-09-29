import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/8bit/alert-dialog.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/8bit/card.jsx';
import { ROSTERS } from '../data/rosters.js';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import { countUnitsBySpecies } from '../logic/ownedUnits.js';
import {
  canSummon, summon, summonAction, summonPrice,
} from '../logic/summon.js';
import {
  getOwnedUnits, getSpiritStones, saveOwnedUnits, saveSpiritStones,
} from '../persistence.js';
import SpiritStonesBalance from '../ui/SpiritStonesBalance.jsx';
import { TEXT, unitName } from '../ui/strings.js';

const T = TEXT.summon;

// technical.md 5.1 / rules.md 11.4 : une ligne par espèce de la faction, avec son prix et un
// bouton « Invoquer » (« Réinvoquer » pour un [Légendaire] mort, « Déjà à vos côtés » tant qu'il
// est vivant), désactivé si l'invocation est impossible. La réinvocation du [Légendaire] passe
// par une boîte de confirmation ; l'annuler ne dépense rien.
export default function SummonScreen({ playerFaction, onBack }) {
  const roster = ROSTERS[playerFaction];
  const [units, setUnits] = useState(() => getOwnedUnits() ?? []);
  const [spiritStones, setSpiritStones] = useState(getSpiritStones);
  const [confirmKey, setConfirmKey] = useState(null); // [Légendaire] en attente de confirmation
  const owned = countUnitsBySpecies(roster, units);

  const doSummon = (key) => {
    const result = summon(roster, units, spiritStones, key);
    if (!result) return;
    saveOwnedUnits(result.units);
    saveSpiritStones(result.spiritStones);
    setUnits(result.units);
    setSpiritStones(result.spiritStones);
  };

  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center gap-8 bg-neutral-900 text-white">
      <SpiritStonesBalance amount={spiritStones} />
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{T.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Object.entries(roster).map(([key, species]) => {
            const action = summonAction(species, owned[key]);
            return (
              <div key={key} className="flex items-center gap-3 border-2 border-white/30 bg-black/40 px-3 py-2">
                <span className="retro text-xs w-8 text-right">{owned[key]}x</span>
                <img
                  src={spritePath(SPECIES_SPRITES[species.name].key)}
                  alt=""
                  className="pixelated size-12 object-contain"
                />
                <div className="flex flex-1 flex-col gap-1 text-xs">
                  <span className="font-bold">{unitName(species)}</span>
                  <span>{TEXT.spiritStones(summonPrice(species))}</span>
                </div>
                <Button
                  size="sm"
                  disabled={!canSummon(species, owned[key], spiritStones)}
                  onClick={() => (action === 'resummon' ? setConfirmKey(key) : doSummon(key))}
                >
                  {TEXT.summonActions[action]}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Button onClick={onBack}>{TEXT.civilization.back}</Button>

      <AlertDialog open={confirmKey !== null} onOpenChange={(open) => !open && setConfirmKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmKey && T.confirmResummon(unitName(roster[confirmKey]), summonPrice(roster[confirmKey]))}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{TEXT.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => doSummon(confirmKey)}>{TEXT.summonActions.resummon}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
