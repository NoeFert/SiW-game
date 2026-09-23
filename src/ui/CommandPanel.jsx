import { Button } from '@/components/ui/8bit/button.jsx';
import { useBattle } from './useBattle.js';
import { canIssueCommand, COMMAND_COOLDOWN_SECONDS } from '../logic/commands.js';
import { issuePlayerFlee } from '../logic/battle.js';
import { interactionState, exitCommandMode } from '../state/interactionState.js';

// rules.md 5 : le bouton "Commandes" met la bataille en pause ; le joueur sélectionne ensuite
// une unité sur le terrain (clic géré par BattleScene, qui écrit interactionState.selectedUnit)
// puis lui donne une commande — attaquer/se déplacer se font en cliquant le terrain, fuir se
// fait via le bouton ci-dessous. Une seule commande par activation, puis reprise automatique.
export default function CommandPanel() {
  const battle = useBattle();
  if (!battle) return null;

  const { commandModeActive, selectedUnit } = interactionState;
  const ready = canIssueCommand(battle.playerCommandState, battle.elapsedSeconds);
  const remaining = ready
    ? 0
    : COMMAND_COOLDOWN_SECONDS - (battle.elapsedSeconds - battle.playerCommandState.lastCommandTime);

  const startCommandMode = () => {
    if (battle.outcome !== 'ongoing' || !ready || commandModeActive) return;
    interactionState.commandModeActive = true;
    interactionState.selectedUnit = null;
    interactionState.paused = true;
  };

  const flee = () => {
    if (!selectedUnit) return;
    issuePlayerFlee(battle, selectedUnit);
    exitCommandMode();
  };

  return (
    <div className="p-4 flex flex-col gap-2">
      <h2 className="font-bold text-sm">Commandes</h2>
      <Button
        onClick={startCommandMode}
        disabled={battle.outcome !== 'ongoing' || !ready || commandModeActive}
        className="w-full text-xs"
      >
        Commandes
      </Button>
      <p className="text-xs text-neutral-300">
        {ready ? 'Commande disponible' : `Cooldown : ${remaining.toFixed(1)}s`}
      </p>

      {commandModeActive && (
        <div className="flex flex-col gap-2 text-xs mt-2 border-t border-neutral-700 pt-2">
          <p className="text-yellow-400">
            {selectedUnit
              ? 'Clique un ennemi (attaquer) ou une case (se déplacer) sur le terrain.'
              : 'Sélectionne une unité sur le terrain.'}
          </p>
          {selectedUnit && (
            <Button variant="destructive" onClick={flee} className="w-full">
              {'\u{1F3F3}'} Fuir
            </Button>
          )}
          <Button variant="ghost" onClick={exitCommandMode} className="w-full">
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
}
