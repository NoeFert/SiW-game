// rules.md 5 : donner une commande ne met jamais la bataille en pause (contrairement au
// déploiement, section 2) — ces fonctions attachent juste une intention à l'unité
// (`unit.command`), exécutée ensuite tick par tick par resolveCombatTick (combat.js).
// Une unité sans commande garde son comportement autonome déjà codé dans combat.js.
export const COMMAND_COOLDOWN_SECONDS = 5;

// État partagé par camp : une seule commande toutes les COMMAND_COOLDOWN_SECONDS secondes,
// peu importe l'unité ciblée (rules.md 5.1).
export function createCommandState() {
  return { lastCommandTime: -Infinity };
}

export function canIssueCommand(commandState, currentTime) {
  return currentTime - commandState.lastCommandTime >= COMMAND_COOLDOWN_SECONDS;
}

function issue(commandState, currentTime, unit, command) {
  if (!canIssueCommand(commandState, currentTime)) return false;
  unit.command = command;
  commandState.lastCommandTime = currentTime;
  return true;
}

export function commandAttack(commandState, currentTime, unit, target) {
  return issue(commandState, currentTime, unit, { type: 'attack', target });
}

export function commandMoveTo(commandState, currentTime, unit, x, y) {
  return issue(commandState, currentTime, unit, { type: 'moveTo', x, y });
}

export function commandFlee(commandState, currentTime, unit) {
  return issue(commandState, currentTime, unit, { type: 'flee' });
}
