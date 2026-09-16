import {
  createFactionState, surrender, updateFactionEndState, evaluateBattleOutcome,
  RESERVE_DEPLOY_COUNTDOWN_SECONDS,
} from '../../src/logic/battleEnd.js';
import { createDeploymentState, deployUnit, recordReturn } from '../../src/logic/deployment.js';

// Roster fictif minimal, isolé de units.md, pour piloter précisément les réserves.
const ROSTER = {
  grunt: {
    name: 'Grunt', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 20, damage: 1, moveSpeed: 1, attackSpeed: 1, range: null, copies: 2,
  },
};

function emptyDeployment() {
  return createDeploymentState(ROSTER);
}

function depletedDeployment() {
  const state = createDeploymentState(ROSTER);
  state.bySpecies.get(ROSTER.grunt).freshRemaining = 0;
  return state;
}

describe('victoire immédiate (rules.md 8.1)', () => {
  test('se déclenche quand l\'ennemi n\'a plus aucune unité, terrain et réserve confondus', () => {
    const player = { factionState: createFactionState(), unitsOnField: ['unite-joueur'], deploymentState: emptyDeployment() };
    const enemy = { factionState: createFactionState(), unitsOnField: [], deploymentState: depletedDeployment() };

    expect(evaluateBattleOutcome(player, enemy)).toBe('playerVictory');
  });

  test('pas de victoire tant que l\'ennemi a encore une unité sur le terrain OU en réserve', () => {
    const player = { factionState: createFactionState(), unitsOnField: [], deploymentState: emptyDeployment() };

    const stillHasReserves = { factionState: createFactionState(), unitsOnField: [], deploymentState: emptyDeployment() };
    expect(evaluateBattleOutcome(player, stillHasReserves)).toBe('ongoing');

    const stillOnField = { factionState: createFactionState(), unitsOnField: ['unite'], deploymentState: depletedDeployment() };
    expect(evaluateBattleOutcome(player, stillOnField)).toBe('ongoing');
  });
});

describe('compte à rebours (rules.md 8.2)', () => {
  test('se déclenche quand le terrain est vide avec des réserves restantes', () => {
    const factionState = createFactionState();
    updateFactionEndState(factionState, [], emptyDeployment(), 0);

    expect(factionState.countdownRemaining).toBe(RESERVE_DEPLOY_COUNTDOWN_SECONDS);
    expect(factionState.defeated).toBe(false);
  });

  test('ne se déclenche pas quand les réserves sont épuisées (c\'est une élimination, 8.1)', () => {
    const factionState = createFactionState();
    updateFactionEndState(factionState, [], depletedDeployment(), 0);

    expect(factionState.countdownRemaining).toBeNull();
  });

  test('un redéploiement (terrain non vide) annule le compte à rebours', () => {
    const factionState = createFactionState();
    updateFactionEndState(factionState, [], emptyDeployment(), 0);
    expect(factionState.countdownRemaining).toBe(15);

    updateFactionEndState(factionState, ['unite-redéployée'], emptyDeployment(), 1);

    expect(factionState.countdownRemaining).toBeNull();
    expect(factionState.defeated).toBe(false);
  });

  test('défaite automatique une fois le délai écoulé sans redéploiement', () => {
    const factionState = createFactionState();
    const deployment = emptyDeployment();

    updateFactionEndState(factionState, [], deployment, 0);
    updateFactionEndState(factionState, [], deployment, RESERVE_DEPLOY_COUNTDOWN_SECONDS);

    expect(factionState.defeated).toBe(true);
  });

  test('les réserves restantes après cette défaite ne sont pas marquées comme perdues', () => {
    const factionState = createFactionState();
    const deployment = emptyDeployment(); // 2 copies fraîches de Grunt

    updateFactionEndState(factionState, [], deployment, 0);
    updateFactionEndState(factionState, [], deployment, RESERVE_DEPLOY_COUNTDOWN_SECONDS);

    expect(factionState.defeated).toBe(true);
    // Toujours déployable : la défaite n'a pas touché la réserve réelle.
    const result = deployUnit(deployment, 'player', ROSTER.grunt, 0, 0, []);
    expect(result.success).toBe(true);
  });

  test('le verdict global reflète la défaite automatique une fois déclenchée', () => {
    const player = { factionState: createFactionState(), unitsOnField: ['unite-joueur'], deploymentState: emptyDeployment() };
    const enemyDeployment = emptyDeployment();
    const enemyFactionState = createFactionState();
    updateFactionEndState(enemyFactionState, [], enemyDeployment, 0);
    updateFactionEndState(enemyFactionState, [], enemyDeployment, RESERVE_DEPLOY_COUNTDOWN_SECONDS);
    const enemy = { factionState: enemyFactionState, unitsOnField: [], deploymentState: enemyDeployment };

    expect(evaluateBattleOutcome(player, enemy)).toBe('playerVictory');
  });
});

describe('mort vs fuite au niveau des réserves (rules.md 2/4.4)', () => {
  test('une unité qui fuit reste disponible et compte comme réserve pour le compte à rebours', () => {
    const deployment = emptyDeployment();
    const { unit } = deployUnit(deployment, 'player', ROSTER.grunt, 0, 0, []);
    unit.hp = 7; // dégâts subis avant la fuite

    recordReturn(deployment, unit);

    const factionState = createFactionState();
    updateFactionEndState(factionState, [], deployment, 0);
    expect(factionState.countdownRemaining).toBe(RESERVE_DEPLOY_COUNTDOWN_SECONDS); // toujours des réserves
  });
});

describe('abandon explicite (rules.md 8.2)', () => {
  test('marque le camp défait immédiatement, sans toucher aux réserves', () => {
    const factionState = createFactionState();
    surrender(factionState);

    expect(factionState.defeated).toBe(true);

    const deployment = emptyDeployment();
    expect(deployUnit(deployment, 'player', ROSTER.grunt, 0, 0, []).success).toBe(true);
  });
});
