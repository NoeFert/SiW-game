import { canIssueCommand } from './commands.js';

// technical.md 5.5 : moteur de tutoriel. Le contenu d'un tutoriel (ses étapes) est une donnée
// propre à chaque bataille (src/data/tutorials.js) ; ce module ne fait que le dérouler.
//
// Une étape figée (`frozen`) arrête la bataille (`pause.tutorial`) et n'autorise que les
// actions listées dans `allows` (null = toutes). Noms d'action : 'deploy', 'mainPause',
// 'openCommandBar', 'order:<ordre>', 'selectUnit:<ordre ou none>', 'selectTarget'. L'abandon
// n'est jamais bloqué (rules.md 8.2).
//
// Passage à l'étape suivante : dès qu'UNE des conditions de `next` est remplie, et que TOUTES
// les conditions `requires` de l'étape suivante le sont aussi. `back` ramène à une étape
// précédente (ex. barre de commandes refermée avant d'avoir donné l'ordre).

// Conditions utilisables dans les données, par `type`. `tutorial.stepSeconds` est du temps
// de bataille : il n'avance pas pendant une pause.
const CONDITIONS = {
  playerUnitOnField: (battle) => battle.units.some((u) => u.faction === 'player' && u.isOnField),
  elapsed: (battle, { seconds }) => battle.tutorial.stepSeconds >= seconds,
  continueClicked: (battle) => battle.tutorial.continued,
  // `fromEnd` : 1 = dernière vague du script IA, 2 = avant-dernière, etc.
  enemyWaveDeployed: (battle, { fromEnd }) => battle.aiScriptState.nextIndex >= battle.enemyScript.length - fromEnd + 1,
  // `phaseIndex` : 0 = phase 1, 1 = phase 2, etc. (rules.md 7.3). Temps de bataille depuis le
  // début réel de la phase (transition non comptée) ; toujours vraie dans une phase ultérieure.
  phaseElapsed: (battle, { phaseIndex, seconds }) => battle.phaseIndex > phaseIndex
    || (battle.phaseIndex === phaseIndex && battle.elapsedSeconds - battle.phaseStartSeconds >= seconds),
  commandAvailable:(battle) => canIssueCommand(battle.playerCommandState, battle.elapsedSeconds),
  commandIssued: (battle) => !canIssueCommand(battle.playerCommandState, battle.elapsedSeconds),
  noGestureInProgress: (battle) => battle.pause.interaction === null && battle.commandSelection === null,
  commandBarOpen: (battle) => battle.commandSelection !== null,
  commandBarClosed: (battle) => battle.commandSelection === null,
};

export const TUTORIAL_CONDITION_TYPES = Object.keys(CONDITIONS);

function holds(battle, condition) {
  return CONDITIONS[condition.type](battle, condition);
}

function currentStep(battle) {
  const { tutorial } = battle;
  return tutorial.steps[tutorial.index];
}

// Entre dans l'étape `index` ; au-delà de la dernière, le tutoriel est terminé.
function goTo(battle, index) {
  const { steps } = battle.tutorial;
  if (index >= steps.length) {
    battle.tutorial = null;
    battle.pause.tutorial = false;
    return;
  }
  Object.assign(battle.tutorial, {
    index, step: steps[index].id, stepSeconds: 0, messageDismissed: false, continued: false,
  });
  battle.pause.tutorial = steps[index].frozen;
}

export function startTutorial(battle, steps) {
  battle.tutorial = { steps };
  goTo(battle, 0);
}

export function tutorialAllows(battle, action) {
  const allows = battle.tutorial ? currentStep(battle).allows : null;
  return allows === null || allows.includes(action);
}

// Bouton [Continuer] du message : le ferme, et fait avancer l'étape si elle l'attend.
export function continueTutorial(battle) {
  if (!battle.tutorial || !currentStep(battle).continueButton) return;
  battle.tutorial.messageDismissed = true;
  battle.tutorial.continued = true;
  updateTutorial(battle, 0);
}

// Étape dont le message est à afficher (null si aucun).
export function visibleTutorialStep(battle) {
  const { tutorial } = battle;
  if (!tutorial) return null;
  const step = currentStep(battle);
  if (!step.message || tutorial.messageDismissed) return null;
  if (step.messageSeconds !== undefined && tutorial.stepSeconds >= step.messageSeconds) return null;
  return step;
}

// Appelé par tickBattle : avec `deltaSeconds` = 0 pendant un gel (une étape figée peut se
// terminer), avec le temps écoulé sinon.
export function updateTutorial(battle, deltaSeconds) {
  const { tutorial } = battle;
  if (!tutorial) return;
  tutorial.stepSeconds += deltaSeconds;
  const step = currentStep(battle);

  const nextStep = tutorial.steps[tutorial.index + 1];
  const nextReady = (nextStep?.requires ?? []).every((condition) => holds(battle, condition));
  if (step.next.some((condition) => holds(battle, condition)) && nextReady) {
    goTo(battle, tutorial.index + 1);
    return;
  }
  if (step.back && holds(battle, step.back.when)) {
    goTo(battle, tutorial.steps.findIndex((s) => s.id === step.back.to));
  }
}
