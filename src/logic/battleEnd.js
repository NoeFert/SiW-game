import { hasAnyReserves } from './deployment.js';

// rules.md 8 : conditions de fin de bataille, symétriques joueur/IA. Les réserves réelles
// (copies disponibles par unité) vivent dans deployment.js — ce module ne fait que les
// consulter via `hasAnyReserves` pour décider victoire/compte à rebours/défaite.
export const RESERVE_DEPLOY_COUNTDOWN_SECONDS = 15;

export function createFactionState() {
  return { countdownRemaining: null, defeated: false };
}

// rules.md 8.2, dernière clause : abandon explicite du joueur ou de l'IA.
export function surrender(factionState) {
  factionState.defeated = true;
  factionState.countdownRemaining = 0;
}

// rules.md 8.1 : plus aucune unité sur le terrain ni en réserve — défaite permanente immédiate.
export function isEliminated(unitsOnField, deploymentState) {
  return unitsOnField.length === 0 && !hasAnyReserves(deploymentState);
}

// rules.md 8.2 : terrain vide mais réserves restantes -> compte à rebours de 15s avant défaite
// automatique. Un redéploiement (terrain à nouveau non vide) annule le compte à rebours.
// La défaite qui en résulte ne touche jamais les réserves : elles ne sont pas perdues.
export function updateFactionEndState(factionState, unitsOnField, deploymentState, deltaSeconds) {
  if (
    factionState.defeated
    || isEliminated(unitsOnField, deploymentState)
    || unitsOnField.length > 0
  ) {
    factionState.countdownRemaining = null;
    return factionState;
  }

  factionState.countdownRemaining = factionState.countdownRemaining === null
    ? RESERVE_DEPLOY_COUNTDOWN_SECONDS
    : factionState.countdownRemaining - deltaSeconds;

  if (factionState.countdownRemaining <= 0) {
    factionState.countdownRemaining = 0;
    factionState.defeated = true;
  }

  return factionState;
}

// rules.md 8 : verdict global. `side` = { factionState, unitsOnField, deploymentState }.
// 'draw' est un cas limite non détaillé par les specs (les deux camps éliminés au même tick,
// possible du fait des dégâts simultanés de la section 4.1) — à signaler, pas dans rules.md.
export function evaluateBattleOutcome(player, enemy) {
  const playerLost = player.factionState.defeated || isEliminated(player.unitsOnField, player.deploymentState);
  const enemyLost = enemy.factionState.defeated || isEliminated(enemy.unitsOnField, enemy.deploymentState);

  if (playerLost && enemyLost) return 'draw';
  if (enemyLost) return 'playerVictory';
  if (playerLost) return 'enemyVictory';
  return 'ongoing';
}
