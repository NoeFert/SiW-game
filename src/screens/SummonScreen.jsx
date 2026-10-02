import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/8bit/alert-dialog.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import { ROSTERS } from '../data/rosters.js';
import { countUnitsBySpecies } from '../logic/ownedUnits.js';
import {
  canSummon, resummonPrice, summon, summonAction, summonPrice,
} from '../logic/summon.js';
import {
  getFallenLegendaryLevel, getOwnedUnits, getSpiritStones, saveOwnedUnits, saveSpiritStones,
} from '../persistence.js';
import ScreenLayout from '../ui/ScreenLayout.jsx';
import { SpeciesCountRow } from '../ui/SpeciesSprite.jsx';
import SpiritStonesBalance, { SpiritStonesAmount } from '../ui/SpiritStonesBalance.jsx';
import { TEXT, unitName } from '../ui/strings.js';

const T = TEXT.summon;

// technical.md 5.1 / rules.md 11.4 : une ligne par espèce de la faction, avec son prix et un
// bouton « Invoquer » (« Réinvoquer » pour un [Légendaire] mort, « Déjà à vos côtés » tant qu'il
// est vivant), désactivé si l'invocation est impossible. La réinvocation du [Légendaire] passe
// par une boîte de confirmation où le joueur choisit le niveau gardé (de 1 à son niveau à sa
// mort), avec le prix de chaque niveau ; l'annuler ne dépense rien.
export default function SummonScreen({ playerFaction, onBack }) {
  const roster = ROSTERS[playerFaction];
  const [units, setUnits] = useState(() => getOwnedUnits() ?? []);
  const [spiritStones, setSpiritStones] = useState(getSpiritStones);
  const [confirm, setConfirm] = useState(null); // { key, level } : [Légendaire] à réinvoquer
  const fallenLevel = getFallenLegendaryLevel() ?? 1;
  const owned = countUnitsBySpecies(roster, units);

  const doSummon = (key, level = 1) => {
    const result = summon(roster, units, spiritStones, key, level, fallenLevel);
    if (!result) return;
    saveOwnedUnits(result.units);
    saveSpiritStones(result.spiritStones);
    setUnits(result.units);
    setSpiritStones(result.spiritStones);
  };

  const confirmSpecies = confirm && roster[confirm.key];
  const levels = Array.from({ length: fallenLevel }, (_, i) => i + 1);

  return (
    <ScreenLayout title={T.title} onBack={onBack}>
      <SpiritStonesBalance amount={spiritStones} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(24rem,1fr))] gap-3">
        {Object.entries(roster).map(([key, species]) => {
          const action = summonAction(species, owned[key]);
          return (
            <SpeciesCountRow key={key} count={owned[key]} species={species} spriteClassName="size-12">
              <div className="flex flex-1 flex-col gap-1 text-xs">
                <span className="font-bold">{unitName(species)}</span>
                <SpiritStonesAmount amount={summonPrice(species)} />
              </div>
              <Button
                size="sm"
                disabled={!canSummon(species, owned[key], spiritStones)}
                onClick={() => (action === 'resummon' ? setConfirm({ key, level: 1 }) : doSummon(key))}
              >
                {TEXT.summonActions[action]}
              </Button>
            </SpeciesCountRow>
          );
        })}
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm && T.confirmResummon(
                unitName(confirmSpecies),
                confirm.level,
                resummonPrice(confirmSpecies, confirm.level),
              )}
            </AlertDialogTitle>
            {confirm && fallenLevel > 1 && (
              <AlertDialogDescription asChild>
                <div className="flex flex-col gap-3">
                  <span>{T.keptLevel}</span>
                  <div className="flex flex-wrap gap-2">
                    {levels.map((level) => (
                      <Button
                        key={level}
                        size="sm"
                        variant={confirm.level === level ? 'default' : 'secondary'}
                        disabled={!canSummon(confirmSpecies, 0, spiritStones, level, fallenLevel)}
                        onClick={() => setConfirm({ ...confirm, level })}
                      >
                        {T.levelPrice(level, resummonPrice(confirmSpecies, level))}
                      </Button>
                    ))}
                  </div>
                </div>
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{TEXT.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => doSummon(confirm.key, confirm.level)}>
              {TEXT.summonActions.resummon}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenLayout>
  );
}
