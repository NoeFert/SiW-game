import { resolveCombatTick } from './combat.js';
import { createCommandState, commandAttack, commandMoveTo, commandFlee } from './commands.js';
import { createAiScriptState, deployScheduledUnits } from './aiScript.js';
import {
  createDeploymentState, deployUnit, recordReturn, consumeFreshCopy, isValidDeploymentPosition,
} from './deployment.js';
import { createFactionState, updateFactionEndState, evaluateBattleOutcome } from './battleEnd.js';

// Assemble déploiement (rules.md 2, 7), commandes (5, consommées par resolveCombatTick),
// résolution de combat (4, 6) et fin de bataille (8) en une seule boucle par tick. Aucune
// décision d'IA ici : le script dit quoi/quand/où (7), resolveCombatTick fait le reste,
// identique pour joueur et IA — c'est tout le principe de cette architecture par couches.
export function createBattle(grid, playerRoster, enemyRoster, enemyScript) {
  return {
    grid,
    units: [],
    elapsedSeconds: 0,
    outcome: 'ongoing',
    playerCommandState: createCommandState(),
    aiScriptState: createAiScriptState(),
    enemyScript,
    playerDeployment: createDeploymentState(playerRoster),
    enemyDeployment: createDeploymentState(enemyRoster),
    playerEndState: createFactionState(),
    enemyEndState: createFactionState(),
    onFieldById: new Map(), // détecte les fuites qui viennent d'aboutir (transition on-field -> off-field)
  };
}

// rules.md 1/2 : déploiement du joueur — position dans sa moitié du terrain et case libre,
// plafond de points, copies, limite du [Légendaire]. Le vrai contrôle du temps (pause
// tactique) viendra de Phaser ; on ne fait que relayer le signal (`result.timeControl`)
// renvoyé par deployment.js.
export function deployPlayerUnit(battle, species, x, y) {
  const unitsOnField = battle.units.filter((u) => u.isOnField);
  if (!isValidDeploymentPosition(battle.grid, 'player', species, x, y, unitsOnField)) {
    return { success: false, reason: 'invalidPosition' };
  }
  const result = deployUnit(battle.playerDeployment, 'player', species, x, y, unitsOnField);
  if (result.success) battle.units.push(result.unit);
  return result;
}

// rules.md 5 : commandes du joueur, gatées par le cooldown global de battle.playerCommandState.
export function issuePlayerAttack(battle, unit, target) {
  return commandAttack(battle.playerCommandState, battle.elapsedSeconds, unit, target);
}

export function issuePlayerMoveTo(battle, unit, x, y) {
  return commandMoveTo(battle.playerCommandState, battle.elapsedSeconds, unit, x, y);
}

export function issuePlayerFlee(battle, unit) {
  return commandFlee(battle.playerCommandState, battle.elapsedSeconds, unit);
}

// rules.md 7 : déploiements scriptés de l'IA — pré-autorisés (script déjà équilibré), donc pas
// de passage par les vérifications de deployUnit ; seul le registre de copies est mis à jour
// (consumeFreshCopy) pour que les réserves restent exactes côté battleEnd.js (8).
function deployScriptedEnemies(battle) {
  const due = deployScheduledUnits(battle.enemyScript, battle.aiScriptState, battle.elapsedSeconds, 'enemy');
  for (const unit of due) {
    consumeFreshCopy(battle.enemyDeployment, unit.species);
    battle.units.push(unit);
  }
}

// rules.md 2 : une unité qui fuit et atteint le bord retourne en réserve (PV réduits conservés).
// Détecté par transition (elle était sur le terrain au tick précédent, ne l'est plus) plutôt
// que par un évènement explicite de combat.js, pour ne pas coupler ces deux modules.
function processDepartures(battle) {
  for (const unit of battle.units) {
    const wasOnField = battle.onFieldById.get(unit.id) ?? true;
    if (wasOnField && !unit.isOnField && unit.hasFled) {
      const deployment = unit.faction === 'player' ? battle.playerDeployment : battle.enemyDeployment;
      recordReturn(deployment, unit);
    }
    battle.onFieldById.set(unit.id, unit.isOnField);
  }
}

// Fait avancer la bataille de `deltaSeconds` et renvoie le verdict à jour
// ('ongoing' | 'playerVictory' | 'enemyVictory' | 'draw').
export function tickBattle(battle, deltaSeconds) {
  if (battle.outcome !== 'ongoing') return battle.outcome;

  battle.elapsedSeconds += deltaSeconds;
  deployScriptedEnemies(battle);
  resolveCombatTick(battle.units, battle.grid, deltaSeconds);
  processDepartures(battle);

  const playerUnitsOnField = battle.units.filter((u) => u.faction === 'player' && u.isOnField);
  const enemyUnitsOnField = battle.units.filter((u) => u.faction === 'enemy' && u.isOnField);

  updateFactionEndState(battle.playerEndState, playerUnitsOnField, battle.playerDeployment, deltaSeconds);
  updateFactionEndState(battle.enemyEndState, enemyUnitsOnField, battle.enemyDeployment, deltaSeconds);

  battle.outcome = evaluateBattleOutcome(
    { factionState: battle.playerEndState, unitsOnField: playerUnitsOnField, deploymentState: battle.playerDeployment },
    { factionState: battle.enemyEndState, unitsOnField: enemyUnitsOnField, deploymentState: battle.enemyDeployment },
  );

  return battle.outcome;
}
