import { resolveCombatTick } from './combat.js';
import { createCommandState, commandAttack, commandMoveTo, commandFlee } from './commands.js';
import { createAiScriptState, deployScheduledUnits } from './aiScript.js';
import {
  createDeploymentState, deployUnit, recordReturn, consumeFreshCopy, isValidDeploymentPosition,
} from './deployment.js';
import {
  createFactionState, updateFactionEndState, evaluateBattleOutcome, surrender,
} from './battleEnd.js';

// Assemble déploiement (rules.md 2, 7), commandes (5, consommées par resolveCombatTick),
// résolution de combat (4, 6) et fin de bataille (8) en une seule boucle par tick. Aucune
// décision d'IA ici : le script dit quoi/quand/où (7), resolveCombatTick fait le reste,
// identique pour joueur et IA — c'est tout le principe de cette architecture par couches.
// `rng` : source d'aléa du choix de case de l'IA (rules.md 7.2), injectable en test.
export function createBattle(grid, playerRoster, enemyRoster, enemyScript, rng = Math.random) {
  return {
    grid,
    rng,
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
    abilityEvents: [], // aptitudes déclenchées au dernier tick (rules.md 6), pour feedback visuel
  };
}

// rules.md 8.2, dernière clause : abandon explicite du joueur pendant le compte à rebours.
export function surrenderPlayer(battle) {
  surrender(battle.playerEndState);
}

// rules.md 1/2 : déploiement du joueur — position dans sa moitié du terrain et case libre,
// plafond de points, copies, limite du [Légendaire]. `copyChoice` ('fresh', des PV précis, ou
// omis pour le choix par défaut) laisse la sidebar garantir la copie exacte que le joueur a
// glissée — voir deployment.js. Le vrai contrôle du temps (pause tactique) viendra de Phaser ;
// on ne fait que relayer le signal (`result.timeControl`) renvoyé par deployment.js.
export function deployPlayerUnit(battle, species, x, y, copyChoice) {
  const unitsOnField = battle.units.filter((u) => u.isOnField);
  if (!isValidDeploymentPosition(battle.grid, 'player', species, x, y, unitsOnField)) {
    return { success: false, reason: 'invalidPosition' };
  }
  const result = deployUnit(battle.playerDeployment, 'player', species, x, y, unitsOnField, copyChoice);
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
// (consumeFreshCopy) pour que les réserves restent exactes côté battleEnd.js (8). La case
// d'apparition est choisie par aiScript.js (rules.md 7.2).
function deployScriptedEnemies(battle) {
  const due = deployScheduledUnits(
    battle.enemyScript, battle.aiScriptState, battle.elapsedSeconds, 'enemy', battle.grid, battle.units, battle.rng,
  );
  for (const unit of due) {
    consumeFreshCopy(battle.enemyDeployment, unit.species);
    battle.units.push(unit);
  }
}

// rules.md 2 : une unité qui fuit et atteint le bord retourne en réserve (PV réduits conservés).
// Détecté par transition (elle était sur le terrain au tick précédent, ne l'est plus) plutôt
// que par un évènement explicite de combat.js, pour ne pas coupler ces deux modules.
// Une unité tuée au tick même où elle atteint le bord est morte, pas en fuite (rules.md 4.4) :
// sa copie est perdue, elle ne revient jamais en réserve.
function processDepartures(battle) {
  for (const unit of battle.units) {
    const wasOnField = battle.onFieldById.get(unit.id) ?? true;
    if (wasOnField && !unit.isOnField && unit.hasFled && unit.isAlive) {
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
  battle.abilityEvents = resolveCombatTick(battle.units, battle.grid, deltaSeconds);
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
