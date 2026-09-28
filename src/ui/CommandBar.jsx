import { Flag, MoveRight, Swords, X } from 'lucide-react';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/8bit/tooltip.jsx';
import { cn } from '@/lib/utils';
import { COMMAND_COOLDOWN_SECONDS, getCooldownRemaining } from '../logic/commands.js';
import {
  ORDERS, canOpenCommandBar, openCommandBar, cancelCommand, chooseOrder,
} from '../logic/commandSelection.js';
import { TEXT } from './strings.js';

// Icônes provisoires (ui-battle-screen-decisions.md 2.3).
const ORDER_ICONS = { move: MoveRight, attack: Swords, flee: Flag };

// rules.md 5 : barre de commandes, type menu burger. Fermée : bouton "Commandes" pleine
// largeur, qui affiche l'avancement du cooldown. Ouverte : [X] à la même place, puis les
// ordres en icônes déroulés vers la droite. La sélection de l'unité et de la cible se fait
// sur le terrain (BattleScene -> clickField) ; tout le déroulé est dans commandSelection.js.
export default function CommandBar({ battle }) {
  const selection = battle.commandSelection;

  if (!selection) {
    const remaining = getCooldownRemaining(battle.playerCommandState, battle.elapsedSeconds);
    const progress = 1 - remaining / COMMAND_COOLDOWN_SECONDS;
    return (
      <Button
        data-tutorial="commands-button"
        onClick={() => openCommandBar(battle)}
        disabled={!canOpenCommandBar(battle)}
        className="relative w-full overflow-hidden text-xs"
      >
        {remaining > 0 && (
          <span className="absolute inset-y-0 left-0 bg-foreground/30" style={{ width: `${progress * 100}%` }} />
        )}
        <span className="relative">
          {TEXT.commands}{remaining > 0 && ` ${remaining.toFixed(1)}s`}
        </span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Button size="icon" onClick={() => cancelCommand(battle)} aria-label={TEXT.cancel}>
        <X />
      </Button>
      {ORDERS.map((order) => {
        const Icon = ORDER_ICONS[order];
        return (
          <Tooltip key={order}>
            <TooltipTrigger>
              <Button
                data-tutorial={`order-${order}`}
                size="icon"
                onClick={() => chooseOrder(battle, order)}
                aria-label={TEXT.orders[order]}
                aria-pressed={selection.order === order}
                className={cn(selection.order === order && 'bg-yellow-400 text-black hover:bg-yellow-300')}
              >
                <Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" font="normal">{TEXT.orders[order]}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
