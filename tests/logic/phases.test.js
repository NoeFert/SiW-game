import Grid from '../../src/logic/grid.js';
import Unit from '../../src/logic/unit.js';
import {
  createBattle, deployPlayerUnit, tickBattle, startDeploymentDrag, togglePlayerPause,
} from '../../src/logic/battle.js';
import { openCommandBar } from '../../src/logic/commandSelection.js';
import { isBattleTimeRunning } from '../../src/logic/pause.js';
import {
  setUpcomingPhases, mirrorObstacles, PHASE_TRANSITION_SECONDS,
} from '../../src/logic/phases.js';
import { getReserve } from '../../src/logic/deployment.js';

const ROSTER = {
  fighter: {
    name: 'Fighter', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 100, damage: 1, moveSpeed: 0.1, attackSpeed: 1, range: null, copies: 5,
  },
};

const PHASE_1_SCRIPT = [{ time: 0, species: ROSTER.fighter }];
const PHASE_2_SCRIPT = [{ time: 2, species: ROSTER.fighter }];
const PHASE_2_OBSTACLES = [{ x: 9, y: 0 }];

// Bataille en deux phases : le joueur a une unité blessée sur le terrain ; l'unique ennemi de
// la phase 1 est déployé au premier tick.
function twoPhaseBattle() {
  const battle = createBattle(new Grid(10, 10), ROSTER, ROSTER, PHASE_1_SCRIPT, () => 0);
  setUpcomingPhases(battle, [{ enemyScript: PHASE_2_SCRIPT, obstacles: PHASE_2_OBSTACLES }]);
  const { unit } = deployPlayerUnit(battle, ROSTER.fighter, 3, 4);
  unit.hp = 60;
  tickBattle(battle, 0.1);
  return { battle, unit };
}

function killEnemies(battle) {
  for (const u of battle.units) if (u.faction === 'enemy') u.hp = 0;
}

// Laisse passer toute la transition (sortie puis entrée).
function finishTransition(battle) {
  tickBattle(battle, PHASE_TRANSITION_SECONDS.exit);
  tickBattle(battle, PHASE_TRANSITION_SECONDS.enter);
}

describe('fin de phase (rules.md 7.3)', () => {
  test('script de la phase épuisé et plus aucun ennemi : transition, bataille figée', () => {
    const { battle } = twoPhaseBattle();
    killEnemies(battle);

    tickBattle(battle, 0.1);

    expect(battle.phaseTransition).not.toBeNull();
    expect(battle.outcome).toBe('ongoing');
    expect(isBattleTimeRunning(battle.pause)).toBe(false);
    const elapsed = battle.elapsedSeconds;
    tickBattle(battle, 0.5);
    expect(battle.elapsedSeconds).toBe(elapsed);
  });

  test('pas de transition tant que le script de la phase n\'est pas épuisé', () => {
    const battle = createBattle(new Grid(10, 10), ROSTER, ROSTER, [...PHASE_1_SCRIPT, { time: 50, species: ROSTER.fighter }], () => 0);
    setUpcomingPhases(battle, [{ enemyScript: PHASE_2_SCRIPT, obstacles: [] }]);
    deployPlayerUnit(battle, ROSTER.fighter, 3, 4);
    tickBattle(battle, 0.1);
    killEnemies(battle);

    tickBattle(battle, 0.1);

    expect(battle.phaseTransition).toBeNull();
  });

  test('sans phase suivante, rien ne change : la fin de bataille habituelle s\'applique', () => {
    const battle = createBattle(new Grid(10, 10), ROSTER, ROSTER, PHASE_1_SCRIPT, () => 0);
    deployPlayerUnit(battle, ROSTER.fighter, 3, 4);
    tickBattle(battle, 0.1);
    killEnemies(battle);

    tickBattle(battle, 0.1);

    expect(battle.phaseTransition).toBeNull();
    expect(battle.enemyEndState.countdownRemaining).not.toBeNull(); // rules.md 8.2
  });

  test('pendant la transition, le joueur ne peut ni déployer, ni commander, ni mettre en pause', () => {
    const { battle } = twoPhaseBattle();
    killEnemies(battle);
    tickBattle(battle, 0.1);

    expect(startDeploymentDrag(battle)).toBe(false);
    expect(openCommandBar(battle)).toBe(false);
    expect(togglePlayerPause(battle)).toBe(false);
  });
});

describe('entrée dans la phase suivante (rules.md 7.3)', () => {
  test('nouvelle zone, armée replacée à gauche à la même hauteur, PV perdus non rendus', () => {
    const { battle, unit } = twoPhaseBattle();
    killEnemies(battle);
    tickBattle(battle, 0.1);

    finishTransition(battle);

    expect(battle.phaseTransition).toBeNull();
    expect(battle.phaseIndex).toBe(1);
    expect(battle.grid.isObstacle(9, 0)).toBe(true);
    expect([unit.x, unit.y]).toEqual([0, 4]);
    expect(unit.hp).toBe(60);
    expect(isBattleTimeRunning(battle.pause)).toBe(true);
  });

  test('les morts de la phase 1 ne reviennent pas', () => {
    const { battle, unit } = twoPhaseBattle();
    const { unit: dead } = deployPlayerUnit(battle, ROSTER.fighter, 2, 2);
    dead.hp = 0;
    killEnemies(battle);
    tickBattle(battle, 0.1);

    finishTransition(battle);

    expect(dead.isOnField).toBe(false);
    expect(battle.units.filter((u) => u.faction === 'player' && u.isOnField)).toEqual([unit]);
    expect(getReserve(battle.playerDeployment, ROSTER.fighter).fresh).toBe(3); // 5 - 2 déployées
  });

  test('le script de la phase 2 se compte depuis le début de la phase', () => {
    const { battle } = twoPhaseBattle();
    killEnemies(battle);
    tickBattle(battle, 0.1);
    finishTransition(battle);

    tickBattle(battle, 1.5);
    expect(battle.units.filter((u) => u.faction === 'enemy' && u.isOnField)).toHaveLength(0);
    tickBattle(battle, 0.5); // t=2 depuis le début de la phase 2

    expect(battle.units.filter((u) => u.faction === 'enemy' && u.isOnField)).toHaveLength(1);
  });

  test('la réserve reste déployable dans la zone 2', () => {
    const { battle } = twoPhaseBattle();
    killEnemies(battle);
    tickBattle(battle, 0.1);
    finishTransition(battle);

    expect(startDeploymentDrag(battle)).toBe(true);
    expect(deployPlayerUnit(battle, ROSTER.fighter, 2, 7).success).toBe(true);
  });

  test('deux unités sur la même rangée : la suivante prend la case libre d\'à côté', () => {
    const { battle, unit } = twoPhaseBattle();
    const other = new Unit(ROSTER.fighter, 'player', 1, 4);
    battle.units.push(other);
    killEnemies(battle);
    tickBattle(battle, 0.1);

    finishTransition(battle);

    expect([unit.x, unit.y]).toEqual([0, 4]); // la plus avancée entre la première
    expect([other.x, other.y]).toEqual([1, 4]);
  });
});

describe('victoire à la fin du script (rules.md 7.3)', () => {
  function lastPhaseCleared() {
    const { battle } = twoPhaseBattle();
    battle.victoryWhenScriptCleared = true;
    killEnemies(battle);
    tickBattle(battle, 0.1);
    finishTransition(battle);
    tickBattle(battle, 2); // la vague de la phase 2 (t=2) apparaît
    return battle;
  }

  test('script de la dernière phase fini et plus aucun ennemi vivant : victoire immédiate', () => {
    const battle = lastPhaseCleared();
    expect(battle.outcome).toBe('ongoing');

    killEnemies(battle);
    tickBattle(battle, 0.1);

    expect(battle.outcome).toBe('playerVictory'); // sans le compte à rebours de 15 s
  });

  test('pas de victoire pendant la phase 1, même terrain ennemi vide', () => {
    const { battle } = twoPhaseBattle();
    battle.victoryWhenScriptCleared = true;
    killEnemies(battle);

    tickBattle(battle, 0.1);

    expect(battle.outcome).toBe('ongoing');
    expect(battle.phaseTransition).not.toBeNull();
  });

  test('pas de victoire tant que l\'IA a encore des unités du script à déployer', () => {
    const battle = createBattle(new Grid(10, 10), ROSTER, ROSTER, [...PHASE_1_SCRIPT, { time: 50, species: ROSTER.fighter }], () => 0);
    battle.victoryWhenScriptCleared = true;
    deployPlayerUnit(battle, ROSTER.fighter, 3, 4);
    tickBattle(battle, 0.1);
    killEnemies(battle);

    tickBattle(battle, 0.1);

    expect(battle.outcome).toBe('ongoing');
  });

  test('match nul si le joueur tombe au même instant (rules.md 8.1)', () => {
    const battle = lastPhaseCleared();
    battle.playerDeployment.bySpecies.get(ROSTER.fighter).freshRemaining = 0;
    killEnemies(battle);
    for (const u of battle.units) if (u.faction === 'player') u.hp = 0;

    tickBattle(battle, 0.1);

    expect(battle.outcome).toBe('draw');
  });
});

describe('mirrorObstacles', () => {
  test('retourne les obstacles horizontalement, blocs 2x2 compris', () => {
    expect(mirrorObstacles([{ x: 0, y: 3 }, { x: 2, y: 5, size: 2 }], 24)).toEqual([
      { x: 23, y: 3, size: 1 }, { x: 20, y: 5, size: 2 },
    ]);
  });
});
