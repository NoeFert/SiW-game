import Grid from '../../src/logic/grid.js';
import {
  createBattle, deployPlayerUnit, tickBattle, startDeploymentDrag, endDeploymentDrag, togglePlayerPause,
  surrenderPlayer,
} from '../../src/logic/battle.js';
import {
  openCommandBar, cancelCommand, chooseOrder, selectUnit,
} from '../../src/logic/commandSelection.js';
import { isBattleTimeRunning } from '../../src/logic/pause.js';
import {
  startTutorial, continueTutorial, visibleTutorialStep, tutorialAllows, TUTORIAL_CONDITION_TYPES,
} from '../../src/logic/tutorial.js';
import { STARTER_TUTORIAL, CLICKBAIT_TUTORIAL } from '../../src/data/tutorials.js';
import { BATTLES, FIRST_BATTLE_ID, CLICKBAIT_BATTLE_ID } from '../../src/data/battles.js';
import {
  WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT, WYRMS_CLICKBAIT_PHASE_1_SCRIPT, WYRMS_CLICKBAIT_PHASE_2_SCRIPT, UNDEAD_CLICKBAIT_PHASE_2_SCRIPT,
  WYRMS_CLICKBAIT_PHASE_3_SCRIPT, UNDEAD_CLICKBAIT_PHASE_3_SCRIPT,
} from '../../src/data/battleScript.js';
import { BATTLEFIELD_OBSTACLES, WALL_ZONE_OBSTACLES, FORT_ZONE_OBSTACLES } from '../../src/data/battlefield.js';
import { TEXT } from '../../src/ui/strings.js';

const ROSTER = {
  fighter: {
    name: 'Fighter', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 1000, damage: 1, moveSpeed: 0.1, attackSpeed: 1, range: null, copies: 5,
  },
};

// Script IA de 4 vagues : l'avant-dernière (index 2) arrive à t=20.
const SCRIPT = [0, 8, 20, 35].map((time) => ({ time, species: ROSTER.fighter }));
// Variante où l'avant-dernière vague (t=10) arrive avant la limite d'attente de 8 s.
const EARLY_WAVE_SCRIPT = [0, 5, 10, 35].map((time) => ({ time, species: ROSTER.fighter }));

function newTutorialBattle(script = SCRIPT) {
  const battle = createBattle(new Grid(10, 10), ROSTER, ROSTER, script, () => 0);
  startTutorial(battle, STARTER_TUTORIAL);
  return battle;
}

// Joue l'étape 1 (déploiement) puis laisse passer les 8 s de l'étape 1 (suite).
function reachPresenceStep(script) {
  const battle = newTutorialBattle(script);
  startDeploymentDrag(battle);
  const { unit } = deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
  endDeploymentDrag(battle);
  // Pas de 0,5 s (exacts en binaire) pour que les délais tombent pile.
  for (let i = 0; i < 100 && battle.tutorial.step !== 'presence'; i++) tickBattle(battle, 0.5);
  return { battle, unit };
}

function reachFleeTutorial(script) {
  const { battle, unit } = reachPresenceStep(script);
  continueTutorial(battle);
  while (battle.tutorial.step === 'waitingForWave') tickBattle(battle, 0.5);
  return { battle, unit };
}

describe('tutoriel — étape 1 : déployer (technical.md 5.5)', () => {
  test('la bataille est figée, seul le déploiement est permis', () => {
    const battle = newTutorialBattle();

    tickBattle(battle, 5);

    expect(battle.elapsedSeconds).toBe(0);
    expect(battle.units).toHaveLength(0); // l'IA n'a pas encore déployé sa vague de t=0
    expect(visibleTutorialStep(battle).id).toBe('deploy');
    expect(togglePlayerPause(battle)).toBe(false);
    expect(openCommandBar(battle)).toBe(false);
    expect(startDeploymentDrag(battle)).toBe(true);
  });

  test('le premier déploiement relance la bataille', () => {
    const battle = newTutorialBattle();
    startDeploymentDrag(battle);
    deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
    endDeploymentDrag(battle);

    tickBattle(battle, 1);

    expect(battle.tutorial.step).toBe('autonomous');
    expect(battle.elapsedSeconds).toBe(1);
  });
});

describe('tutoriel — étape 1 (suite) : combat autonome', () => {
  test('le message reste affiché 3 s au plus, la bataille tourne', () => {
    const battle = newTutorialBattle();
    startDeploymentDrag(battle);
    deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
    endDeploymentDrag(battle);
    tickBattle(battle, 0.1);

    tickBattle(battle, 2.5);
    expect(visibleTutorialStep(battle).id).toBe('autonomous');
    tickBattle(battle, 0.5);
    expect(visibleTutorialStep(battle)).toBeNull();
    expect(isBattleTimeRunning(battle.pause)).toBe(true);
  });

  test('[Continuer] ferme le message plus tôt, sans avancer l\'étape', () => {
    const battle = newTutorialBattle();
    startDeploymentDrag(battle);
    deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
    endDeploymentDrag(battle);
    tickBattle(battle, 0.1);

    continueTutorial(battle);

    expect(visibleTutorialStep(battle)).toBeNull();
    expect(battle.tutorial.step).toBe('autonomous');
  });
});

describe('tutoriel — étape 2 : points de présence', () => {
  test('arrive 8 s après le déploiement et fige tout jusqu\'à [Continuer]', () => {
    const { battle } = reachPresenceStep();

    expect(battle.tutorial.step).toBe('presence');
    expect(battle.elapsedSeconds).toBeCloseTo(8, 5); // l'étape 1 (suite) démarre à t=0
    const elapsed = battle.elapsedSeconds;
    tickBattle(battle, 3);
    expect(battle.elapsedSeconds).toBe(elapsed);
    expect(startDeploymentDrag(battle)).toBe(false);
    expect(openCommandBar(battle)).toBe(false);

    continueTutorial(battle);
    tickBattle(battle, 1);

    expect(battle.tutorial.step).toBe('waitingForWave');
    expect(battle.elapsedSeconds).toBe(elapsed + 1);
    expect(startDeploymentDrag(battle)).toBe(true); // retour au jeu normal
  });
});

describe('tutoriel — étape 3 : battre en retraite', () => {
  test('se déclenche à l\'avant-dernière vague de l\'IA si elle arrive avant 8 s d\'attente', () => {
    const { battle } = reachFleeTutorial(EARLY_WAVE_SCRIPT);

    expect(battle.tutorial.step).toBe('openCommands');
    expect(battle.aiScriptState.nextIndex).toBe(EARLY_WAVE_SCRIPT.length - 1);
    expect(battle.elapsedSeconds).toBeGreaterThanOrEqual(10);
    expect(battle.elapsedSeconds).toBeLessThan(8 + 8);
    expect(isBattleTimeRunning(battle.pause)).toBe(false);
    expect(startDeploymentDrag(battle)).toBe(false);
  });

  test('sinon, se déclenche au bout de 8 s d\'attente au plus', () => {
    const { battle } = reachFleeTutorial(); // avant-dernière vague à t=20

    expect(battle.tutorial.step).toBe('openCommands');
    expect(battle.aiScriptState.nextIndex).toBeLessThan(SCRIPT.length - 1);
    expect(battle.elapsedSeconds).toBeCloseTo(8 + 8, 5);
    expect(battle.elapsedSeconds).toBeLessThan(20);
  });

  test('attend qu\'une unité du joueur soit sur le terrain', () => {
    const { battle, unit } = reachPresenceStep();
    continueTutorial(battle);
    unit.hasFled = true; // plus aucune unité du joueur sur le terrain

    for (let i = 0; i < 60; i++) tickBattle(battle, 0.5);

    expect(battle.tutorial.step).toBe('waitingForWave');
  });

  test('seule la fuite est permise ; l\'ordre donné, le tutoriel se termine', () => {
    const { battle, unit } = reachFleeTutorial();
    expect(openCommandBar(battle)).toBe(true);
    tickBattle(battle, 0.1);
    expect(battle.tutorial.step).toBe('flee');

    expect(chooseOrder(battle, 'attack')).toBe(false);
    expect(selectUnit(battle, unit)).toBe(false); // voie 2 bloquée : Fuir est demandé
    expect(chooseOrder(battle, 'flee')).toBe(true);
    expect(selectUnit(battle, unit)).toBe(true);
    expect(unit.command).toEqual({ type: 'flee' });
    tickBattle(battle, 0.1);

    expect(battle.tutorial).toBeNull(); // tutoriel terminé
    expect(isBattleTimeRunning(battle.pause)).toBe(true);
    expect(togglePlayerPause(battle)).toBe(true);
  });

  test('refermer la barre avec [X] ramène à l\'ouverture de la barre', () => {
    const { battle } = reachFleeTutorial();
    openCommandBar(battle);
    tickBattle(battle, 0.1);

    cancelCommand(battle);
    tickBattle(battle, 0.1);

    expect(battle.tutorial.step).toBe('openCommands');
  });
});

describe('tutoriel — abandon', () => {
  test('reste possible pendant une étape figée (rules.md 8.2)', () => {
    const battle = newTutorialBattle();

    surrenderPlayer(battle);

    expect(battle.outcome).toBe('enemyVictory');
  });
});

describe('données des tutoriels et des batailles (src/data/)', () => {
  const allTutorials = [STARTER_TUTORIAL, CLICKBAIT_TUTORIAL];
  const allSteps = allTutorials.flat();

  test('la bataille 01 : une seule phase, script IA par faction, tutoriel de départ', () => {
    expect(BATTLES[FIRST_BATTLE_ID]).toEqual({
      phases: [{
        enemyScripts: { wyrms: WYRMS_AI_SCRIPT, undead: UNDEAD_AI_SCRIPT },
        obstacles: BATTLEFIELD_OBSTACLES,
        flippedBackground: false,
      }],
      tutorial: STARTER_TUTORIAL,
    });
  });

  test('la bataille-clickbait : bataille à part, 3 phases (champ, mur, fort), tutoriel clickbait', () => {
    const { phases, tutorial, victoryWhenScriptCleared } = BATTLES[CLICKBAIT_BATTLE_ID];

    expect(CLICKBAIT_BATTLE_ID).not.toBe(FIRST_BATTLE_ID);
    expect(tutorial).toBe(CLICKBAIT_TUTORIAL);
    expect(victoryWhenScriptCleared).toBe(true);
    expect(BATTLES[FIRST_BATTLE_ID].victoryWhenScriptCleared).toBeUndefined(); // bataille 01 : fin habituelle
    expect(phases[0]).toEqual({
      enemyScripts: { wyrms: WYRMS_CLICKBAIT_PHASE_1_SCRIPT, undead: UNDEAD_AI_SCRIPT },
      obstacles: BATTLEFIELD_OBSTACLES,
      flippedBackground: false,
    });
    expect(WYRMS_CLICKBAIT_PHASE_1_SCRIPT.map((e) => e.species.name)).not.toContain('Fafnir the Cursed One');
    expect(WYRMS_CLICKBAIT_PHASE_1_SCRIPT).toHaveLength(WYRMS_AI_SCRIPT.length - 1);
    expect(phases[1]).toEqual({
      enemyScripts: { wyrms: WYRMS_CLICKBAIT_PHASE_2_SCRIPT, undead: UNDEAD_CLICKBAIT_PHASE_2_SCRIPT },
      obstacles: WALL_ZONE_OBSTACLES,
      flippedBackground: true,
    });
    expect(phases[2]).toEqual({
      enemyScripts: { wyrms: WYRMS_CLICKBAIT_PHASE_3_SCRIPT, undead: UNDEAD_CLICKBAIT_PHASE_3_SCRIPT },
      obstacles: FORT_ZONE_OBSTACLES,
      flippedBackground: false,
    });
  });

  test('chaque condition utilisée existe dans le moteur', () => {
    const used = allSteps.flatMap((step) => [...step.next, ...(step.requires ?? []), ...(step.back ? [step.back.when] : [])]);
    for (const condition of used) expect(TUTORIAL_CONDITION_TYPES).toContain(condition.type);
  });

  test('chaque message a un texte, et chaque retour vise une étape existante', () => {
    for (const step of allSteps) {
      if (step.message) expect(TEXT.tutorial[step.message]).toEqual(expect.any(String));
    }
    for (const tutorial of allTutorials) {
      const ids = tutorial.map((step) => step.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const step of tutorial) if (step.back) expect(ids).toContain(step.back.to);
    }
  });
});

describe('moteur de tutoriel — réutilisable pour une autre bataille', () => {
  test('déroule n\'importe quelle liste d\'étapes, puis rend la main au jeu', () => {
    const battle = createBattle(new Grid(10, 10), ROSTER, ROSTER, SCRIPT, () => 0);
    startTutorial(battle, [
      { id: 'wait', frozen: false, allows: null, next: [{ type: 'elapsed', seconds: 2 }] },
      { id: 'read', frozen: true, allows: [], message: 'presence', continueButton: true, next: [{ type: 'continueClicked' }] },
    ]);

    tickBattle(battle, 2);
    expect(battle.tutorial.step).toBe('read');
    expect(tutorialAllows(battle, 'deploy')).toBe(false);

    continueTutorial(battle);
    expect(battle.tutorial).toBeNull();
    expect(tutorialAllows(battle, 'deploy')).toBe(true);
    expect(isBattleTimeRunning(battle.pause)).toBe(true);
  });

  test('sans tutoriel, aucune action n\'est bloquée', () => {
    const battle = createBattle(new Grid(10, 10), ROSTER, ROSTER, SCRIPT, () => 0);

    expect(battle.tutorial).toBeNull();
    expect(tutorialAllows(battle, 'deploy')).toBe(true);
    expect(openCommandBar(battle)).toBe(true);
  });
});

describe('tutoriel clickbait (bataille-clickbait)', () => {
  function reachClickbaitPresence() {
    const battle = createBattle(new Grid(10, 10), ROSTER, ROSTER, SCRIPT, () => 0);
    startTutorial(battle, CLICKBAIT_TUTORIAL);
    startDeploymentDrag(battle);
    deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
    endDeploymentDrag(battle);
    for (let i = 0; i < 100 && battle.tutorial.step !== 'presence'; i++) tickBattle(battle, 0.5);
    return battle;
  }

  test('étapes : déployer, combat autonome, points de présence', () => {
    expect(CLICKBAIT_TUTORIAL.map((step) => step.id)).toEqual(['deploy', 'autonomous', 'presence']);
  });

  test('l\'étape des PP ne fige pas la bataille et ne bloque aucune action', () => {
    const battle = reachClickbaitPresence();
    const elapsed = battle.elapsedSeconds;

    tickBattle(battle, 1);

    expect(battle.elapsedSeconds).toBe(elapsed + 1);
    expect(visibleTutorialStep(battle).id).toBe('presence');
    expect(startDeploymentDrag(battle)).toBe(true);
  });

  test('l\'étape des PP disparaît seule après 6 s : fin du tutoriel', () => {
    const battle = reachClickbaitPresence();

    tickBattle(battle, 5.5);
    expect(battle.tutorial.step).toBe('presence');
    tickBattle(battle, 0.5);

    expect(battle.tutorial).toBeNull();
    expect(openCommandBar(battle)).toBe(true);
  });
});
