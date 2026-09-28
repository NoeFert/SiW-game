import Grid from './grid.js';
import { createAiScriptState } from './aiScript.js';
import { isValidDeploymentPosition } from './deployment.js';

// rules.md 7.3 : bataille en plusieurs phases (bataille-clickbait). Une phase = un script IA et
// une zone (obstacles). Quand l'IA a déployé tout le script de la phase et qu'il ne lui reste
// plus aucune unité sur le terrain, l'armée du joueur part vers la droite et entre dans la
// zone suivante par la gauche : c'est la transition, pendant laquelle tout est figé.
// Les morts et les PV perdus restent perdus ; la réserve suit (déployable en phase suivante).

// Durées de la transition, en secondes réelles (le temps de bataille est arrêté) : sortie par
// la droite, puis entrée par la gauche dans la nouvelle zone.
export const PHASE_TRANSITION_SECONDS = { exit: 1.5, enter: 1.5 };

// `phases` : phases suivantes, chacune { enemyScript, obstacles } (plus des infos de rendu
// éventuelles, ignorées ici).
export function setUpcomingPhases(battle, phases) {
  battle.upcomingPhases = [...phases];
}

// L'IA a déployé tout le script de la phase en cours et n'a plus aucune unité vivante sur le
// terrain.
export function isEnemyScriptCleared(battle) {
  return battle.aiScriptState.nextIndex >= battle.enemyScript.length
    && !battle.units.some((u) => u.faction === 'enemy' && u.isOnField);
}

export function isPhaseOver(battle) {
  return battle.upcomingPhases.length > 0 && isEnemyScriptCleared(battle);
}

export function startPhaseTransition(battle) {
  battle.phaseTransition = { stage: 'exit', seconds: 0 };
  battle.pause.transition = true;
  battle.commandSelection = null;
  battle.enemyEndState.countdownRemaining = null; // l'IA n'est pas "vaincue" : elle change de zone
}

// Case la plus à gauche libre sur la rangée `y` de la zone du joueur, sinon sur la rangée la
// plus proche : l'unité entre par la gauche, à la même hauteur si possible.
function entryPosition(grid, unit, placed) {
  for (let dy = 0; dy < grid.height; dy++) {
    for (const row of dy === 0 ? [unit.y] : [unit.y - dy, unit.y + dy]) {
      for (let x = 0; x < Math.floor(grid.width / 2); x++) {
        if (isValidDeploymentPosition(grid, 'player', unit.species, x, row, placed)) return { x, y: row };
      }
    }
  }
  return null;
}

function enterNextPhase(battle) {
  const phase = battle.upcomingPhases.shift();
  battle.grid = new Grid(battle.grid.width, battle.grid.height, phase.obstacles);
  battle.enemyScript = phase.enemyScript;
  battle.aiScriptState = createAiScriptState();
  battle.phaseStartSeconds = battle.elapsedSeconds; // le script se compte depuis le début de la phase
  battle.phaseIndex += 1;

  // Les unités de tête prennent les cases les plus à gauche en premier.
  const army = battle.units.filter((u) => u.faction === 'player' && u.isOnField).sort((a, b) => b.x - a.x);
  const placed = [];
  for (const unit of army) {
    const position = entryPosition(battle.grid, unit, placed);
    if (position) Object.assign(unit, position);
    Object.assign(unit, {
      status: 'idle', target: null, command: null, attackTimer: 0, moveProgress: 0,
    });
    placed.push(unit);
  }
}

// Appelé par tickBattle pendant la transition, avec le temps réel écoulé.
export function updatePhaseTransition(battle, deltaSeconds) {
  const transition = battle.phaseTransition;
  transition.seconds += deltaSeconds;
  if (transition.seconds < PHASE_TRANSITION_SECONDS[transition.stage]) return;
  if (transition.stage === 'exit') {
    enterNextPhase(battle);
    battle.phaseTransition = { stage: 'enter', seconds: 0 };
  } else {
    battle.phaseTransition = null;
    battle.pause.transition = false;
  }
}

// Pour le rendu : étape et avancement (0 -> 1) de la transition en cours, ou null.
export function phaseTransitionProgress(battle) {
  const transition = battle.phaseTransition;
  if (!transition) return null;
  return {
    stage: transition.stage,
    progress: Math.min(1, transition.seconds / PHASE_TRANSITION_SECONDS[transition.stage]),
  };
}
