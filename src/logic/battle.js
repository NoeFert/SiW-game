import { resolveCombatTick } from './combat.js';
import { createCommandState, commandAttack, commandMoveTo, commandFlee } from './commands.js';
import { createAiScriptState, deployScheduledUnits } from './aiScript.js';
import {
  createDeploymentState, deployUnit, recordReturn, consumeFreshCopy, isValidDeploymentPosition,
} from './deployment.js';
import {
  createFactionState, updateFactionEndState, evaluateBattleOutcome, surrender,
} from './battleEnd.js';
import {
  createPauseState, isBattleTimeRunning, startInteraction, endInteraction, canStartDeploymentDuringPause,
  recordPlayerAction,
} from './pause.js';

// Assemble déploiement (rules.md 2, 7), commandes (5, consommées par resolveCombatTick),
// pauses (5.2), résolution de combat (4, 6) et fin de bataille (8) en une seule boucle par
// tick. Aucune décision d'IA ici : le script dit quoi/quand/où (7), resolveCombatTick fait le
// reste, identique pour joueur et IA — c'est tout le principe de cette architecture par couches.
// `rng` : source d'aléa du choix de case de l'IA (rules.md 7.2), injectable en test.
export function createBattle(grid, playerRoster, enemyRoster, enemyScript, rng = Math.random) {
  return {
    grid,
    rng,
    units: [],
    elapsedSeconds: 0,
    outcome: 'ongoing',
    pause: createPauseState(), // rules.md 5.2, voir pause.js
    commandSelection: null, // barre de commandes ouverte, voir commandSelection.js
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

// rules.md 8.2, dernière clause : abandon explicite du joueur, possible à tout moment. Le
// verdict est posé tout de suite : pendant une pause, aucun tick ne viendrait le calculer.
export function surrenderPlayer(battle) {
  if (battle.outcome !== 'ongoing') return;
  surrender(battle.playerEndState);
  battle.outcome = evaluateOutcome(battle);
}

// rules.md 5.2 : un drag de déploiement déclenche la pause d'interaction. Refusé pendant la
// sélection d'une commande (les deux gestes sont exclusifs).
export function startDeploymentDrag(battle) {
  if (battle.outcome !== 'ongoing' || battle.commandSelection || !canStartDeploymentDuringPause(battle.pause)) {
    return false;
  }
  startInteraction(battle.pause, 'deploy');
  return true;
}

export function endDeploymentDrag(battle) {
  if (battle.pause.interaction === 'deploy') endInteraction(battle.pause);
}

// rules.md 1/2 : déploiement du joueur — position dans sa moitié du terrain et case libre,
// plafond de points, copies, limite du [Légendaire]. `copyChoice` ('fresh', des PV précis, ou
// omis pour le choix par défaut) laisse la tour garantir la copie exacte que le joueur a
// glissée — voir deployment.js. La pause tactique elle-même est gérée par startDeploymentDrag.
export function deployPlayerUnit(battle, species, x, y, copyChoice) {
  const unitsOnField = battle.units.filter((u) => u.isOnField);
  if (!isValidDeploymentPosition(battle.grid, 'player', species, x, y, unitsOnField)) {
    return { success: false, reason: 'invalidPosition' };
  }
  const result = deployUnit(battle.playerDeployment, 'player', species, x, y, unitsOnField, copyChoice);
  if (result.success) {
    battle.units.push(result.unit);
    recordPlayerAction(battle.pause, 'deploy');
  }
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

// rules.md 7 : déploiements scriptés de l'IA — le plafond vivant et la case sont vérifiés par
// aiScript.js (les copies et le [Légendaire] unique sont garantis par le contenu du script,
// voir battleScript.test.js), donc pas de passage par deployUnit ; seul le registre de copies est mis à jour
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

function unitsOnFieldOf(battle, faction) {
  return battle.units.filter((u) => u.faction === faction && u.isOnField);
}

function evaluateOutcome(battle) {
  return evaluateBattleOutcome(
    { factionState: battle.playerEndState, unitsOnField: unitsOnFieldOf(battle, 'player'), deploymentState: battle.playerDeployment },
    { factionState: battle.enemyEndState, unitsOnField: unitsOnFieldOf(battle, 'enemy'), deploymentState: battle.enemyDeployment },
  );
}

// Fait avancer la bataille de `deltaSeconds` et renvoie le verdict à jour
// ('ongoing' | 'playerVictory' | 'enemyVictory' | 'draw'). Pendant une pause (rules.md 5.2),
// rien n'avance : tous les compteurs restent gelés.
export function tickBattle(battle, deltaSeconds) {
  if (battle.outcome !== 'ongoing' || !isBattleTimeRunning(battle.pause)) return battle.outcome;

  battle.elapsedSeconds += deltaSeconds;
  deployScriptedEnemies(battle);
  battle.abilityEvents = resolveCombatTick(battle.units, battle.grid, deltaSeconds);
  processDepartures(battle);

  updateFactionEndState(battle.playerEndState, unitsOnFieldOf(battle, 'player'), battle.playerDeployment, deltaSeconds);
  updateFactionEndState(battle.enemyEndState, unitsOnFieldOf(battle, 'enemy'), battle.enemyDeployment, deltaSeconds);

  battle.outcome = evaluateOutcome(battle);
  return battle.outcome;
}
