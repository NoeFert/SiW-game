import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/8bit/button.jsx';
import { fountainCapacity, fountainContent, harvestFountain } from '../logic/fountain.js';
import { getFountainLastHarvest, saveFountainLastHarvest } from '../persistence.js';
import { SpiritStoneIcon } from './SpiritStonesBalance.jsx';
import { TEXT } from './strings.js';

// rules.md 11.8 / GRAPHICS.md : Spirit Fountain de l'accueil, affichage provisoire sans asset —
// contenu « X / capacité » et barre de remplissage, recalculés chaque seconde depuis l'heure de
// la dernière récolte. Un clic récolte : `onHarvest(collected)` crédite le solde.
export default function SpiritFountain({ playerLevel, onHarvest }) {
  const [now, setNow] = useState(Date.now);
  const [lastHarvest, setLastHarvest] = useState(getFountainLastHarvest);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (lastHarvest === null) return null; // pas encore en route
  const capacity = fountainCapacity(playerLevel);
  const content = fountainContent(lastHarvest, now, capacity);

  const harvest = () => {
    const result = harvestFountain(lastHarvest, Date.now(), capacity);
    if (result.collected === 0) return;
    saveFountainLastHarvest(result.lastHarvestMs);
    setLastHarvest(result.lastHarvestMs);
    onHarvest(result.collected);
  };

  return (
    <Button onClick={harvest} disabled={content === 0} className="h-auto py-3">
      <span className="flex w-52 flex-col gap-2">
        <span className="retro text-xs">{TEXT.fountain.name}</span>
        <span className="flex items-center justify-center gap-2 text-xs">
          <SpiritStoneIcon />
          {TEXT.fountain.content(content, capacity)}
        </span>
        <span className="h-2 w-full bg-black/70 border border-white/30">
          <span className="block h-full bg-violet-500" style={{ width: `${(content / capacity) * 100}%` }} />
        </span>
      </span>
    </Button>
  );
}
