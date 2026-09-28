import { TooltipProvider } from '@/components/ui/8bit/tooltip.jsx';
import { getPresenceUsed } from '../logic/deployment.js';
import { useBattle } from './useBattle.js';
import PauseButton from './PauseButton.jsx';
import SurrenderButton from './SurrenderButton.jsx';
import PresenceGauge from './PresenceGauge.jsx';
import DeploymentList from './DeploymentList.jsx';
import CommandBar from './CommandBar.jsx';
import { TEXT } from './strings.js';

// ui-battle-screen-decisions.md 1-2 : tour de commandement, à gauche du terrain. De haut en
// bas : Pause (coin haut-droit), jauge de présence, "Vos unités", liste (seule zone qui
// défile), barre de commandes fixée en bas.
export default function CommandTower({ playerFaction }) {
  const battle = useBattle();
  if (!battle) return null;

  const unitsOnField = battle.units.filter((u) => u.isOnField);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-neutral-950 text-foreground border-r-4 border-foreground/40">
        <div className="relative flex-none px-4 pt-4 pb-2">
          <div className="absolute top-3 right-3 flex items-center gap-3">
            {battle.surrenderAllowed && <SurrenderButton battle={battle} />}
            <PauseButton battle={battle} />
          </div>
          <div className="pt-8">
            <PresenceGauge used={getPresenceUsed('player', unitsOnField)} playerFaction={playerFaction} />
          </div>
          <h2 className="retro text-xs mt-4">{TEXT.yourUnits}</h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
          <DeploymentList battle={battle} unitsOnField={unitsOnField} />
        </div>

        <div className="flex-none px-4 py-4 border-t-2 border-foreground/20">
          <CommandBar battle={battle} />
        </div>
      </div>
    </TooltipProvider>
  );
}
