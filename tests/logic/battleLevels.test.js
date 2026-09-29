// Niveaux en bataille (rules.md 2, 11.6) : stats de niveau, réserve par individu, tour par
// espèce et niveau, XP des coups fatals.
import Grid from '../../src/logic/grid.js';
import Unit from '../../src/logic/unit.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';
import { resolveCombatTick } from '../../src/logic/combat.js';
import {
  createDeploymentState, deployUnit, getTowerRows, recordReturn,
} from '../../src/logic/deployment.js';

describe('Unit — stats du niveau (rules.md 11.6)', () => {
  test('niveau 1 par défaut : stats de units.md, sans individu', () => {
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 0, 0);
    expect(unit).toMatchObject({ level: 1, individualId: null, maxHp: 40, hp: 40, damage: 8, killXp: 0 });
  });

  test('PV max et dégâts augmentés selon le niveau, arrondis au plus proche', () => {
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0, 4, 'u1');
    expect(unit).toMatchObject({ level: 4, individualId: 'u1', maxHp: 52, hp: 52, damage: 10 });
  });

  test('hybride : les deux dégâts augmentent ; coût et vitesses inchangés', () => {
    const fafnir = new Unit(WYRMS_ROSTER.fafnir, 'player', 0, 0, 5);
    expect(fafnir.damage).toEqual({ ranged: 42, melee: 63 });
    expect(fafnir.maxHp).toBe(308);
    expect(fafnir.species.cost).toBe(110);
  });
});

describe('réserve du joueur par individu et niveau (rules.md 2, ui-battle-screen-decisions.md 2.2)', () => {
  const individuals = [
    { id: 'a', species: 'lambtonWorm', xp: 0 },
    { id: 'b', species: 'lambtonWorm', xp: 160 }, // niveau 3
    { id: 'c', species: 'lambtonWorm', xp: 10 },
    { id: 'd', species: 'fafnir', xp: 350 }, // niveau 4
  ];

  test('une copie par individu possédé (pas les copies de units.md)', () => {
    const state = createDeploymentState(WYRMS_ROSTER, individuals);
    expect(state.bySpecies.get(WYRMS_ROSTER.lambtonWorm).freshRemaining).toBe(3);
    expect(state.bySpecies.get(WYRMS_ROSTER.amphiptere).freshRemaining).toBe(0);
  });

  test('tour : une ligne par espèce et niveau, niveaux décroissants, stats du niveau', () => {
    const state = createDeploymentState(WYRMS_ROSTER, individuals);
    const rows = getTowerRows(state, 'player', []);
    expect(rows.map((r) => [r.species.name, r.level, r.count, r.hp])).toEqual([
      ['Lambton Worm', 3, 1, 48],
      ['Lambton Worm', 1, 2, 40],
      ['Fafnir the Cursed One', 4, 1, 286],
    ]);
    expect(rows[0]).toMatchObject({ maxHp: 48, damage: 10, showLevel: true, wounded: false });
  });

  test('version clickbait / IA : niveau 1, pas d\'affichage du niveau', () => {
    const rows = getTowerRows(createDeploymentState(WYRMS_ROSTER), 'player', []);
    expect(rows.every((r) => r.level === 1 && r.showLevel === false)).toBe(true);
  });

  test('déployer une ligne déploie un individu de ce niveau, avec ses stats', () => {
    const state = createDeploymentState(WYRMS_ROSTER, individuals);
    const [row] = getTowerRows(state, 'player', []);
    const { unit } = deployUnit(state, 'player', row.species, 0, 0, [], row.copyChoice);
    expect(unit).toMatchObject({ individualId: 'b', level: 3, hp: 48, maxHp: 48 });
    expect(getTowerRows(state, 'player', []).map((r) => r.level)).toEqual([1, 4]);
  });

  test('une unité revenue de fuite garde son niveau et son individu, sur sa propre ligne si blessée', () => {
    const state = createDeploymentState(WYRMS_ROSTER, individuals);
    const [row] = getTowerRows(state, 'player', []);
    const { unit } = deployUnit(state, 'player', row.species, 0, 0, [], row.copyChoice);
    unit.hp = 20;
    recordReturn(state, unit);
    const lambtonRows = getTowerRows(state, 'player', []).filter((r) => r.species === WYRMS_ROSTER.lambtonWorm);
    expect(lambtonRows.map((r) => [r.level, r.hp, r.wounded])).toEqual([[3, 20, true], [1, 40, false]]);

    const again = deployUnit(state, 'player', WYRMS_ROSTER.lambtonWorm, 0, 0, [], lambtonRows[0].copyChoice);
    expect(again.unit).toMatchObject({ individualId: 'b', level: 3, hp: 20, maxHp: 48 });
  });

  test('un niveau absent de la réserve est refusé', () => {
    const state = createDeploymentState(WYRMS_ROSTER, individuals);
    const result = deployUnit(state, 'player', WYRMS_ROSTER.lambtonWorm, 0, 0, [], { level: 2, hp: 44 });
    expect(result).toMatchObject({ success: false, reason: 'noCopiesLeft' });
  });
});

describe('XP des coups fatals (rules.md 11.6)', () => {
  // Un attaquant du joueur prêt à frapper au prochain tick, collé à sa victime.
  const striker = (x) => {
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', x, 0);
    unit.status = 'engaged';
    unit.attackTimer = unit.species.attackSpeed - 0.01;
    return unit;
  };

  test('achever un ennemi rapporte son coût en PP', () => {
    const grid = new Grid(10, 10);
    const worm = striker(0);
    const skeleton = new Unit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 1, 0);
    skeleton.hp = 1;

    resolveCombatTick([worm, skeleton], grid, 0.02);

    expect(skeleton.isAlive).toBe(false);
    expect(worm.killXp).toBe(6);
  });

  test('coup fatal simultané : chaque tueur gagne la totalité du coût', () => {
    const grid = new Grid(10, 10);
    const left = striker(0);
    const right = striker(2);
    const skeleton = new Unit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 1, 0);
    skeleton.hp = 1;

    resolveCombatTick([left, right, skeleton], grid, 0.02);

    expect(left.killXp).toBe(6);
    expect(right.killXp).toBe(6);
  });

  test('blesser sans achever ne rapporte rien', () => {
    const grid = new Grid(10, 10);
    const worm = striker(0);
    const skeleton = new Unit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 1, 0);

    resolveCombatTick([worm, skeleton], grid, 0.02);

    expect(skeleton.isAlive).toBe(true);
    expect(worm.killXp).toBe(0);
  });
});
