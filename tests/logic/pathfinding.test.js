import Grid from '../../src/logic/grid.js';
import Unit from '../../src/logic/unit.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { findNearestEnemy, findPath, chebyshevDistance } from '../../src/logic/pathfinding.js';

function lastStep(path) {
  return path[path.length - 1];
}

describe('findNearestEnemy', () => {
  test('returns the closest living unit of the opposite faction', () => {
    const grid = new Grid(10, 10);
    const self = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const far = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 9, 9);
    const near = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 2, 2);
    const units = [self, far, near];

    expect(findNearestEnemy(self, units)).toBe(near);
  });

  test('measures a 2x2 enemy from its closest cell (rules.md 3)', () => {
    const self = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 5);
    const smallEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 8, 5); // 3 cases
    const bigEnemy = new Unit(WYRMS_ROSTER.fafnir, 'enemy', 2, 2); // (3,3) à 2 cases, coin haut-gauche à 3

    expect(findNearestEnemy(self, [self, smallEnemy, bigEnemy])).toBe(bigEnemy);
  });

  test('ignores allies and dead units', () => {
    const ally = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 1);
    const self = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const deadEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 1, 0);
    deadEnemy.takeDamage(deadEnemy.hp);
    const aliveEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 5, 5);

    expect(findNearestEnemy(self, [ally, self, deadEnemy, aliveEnemy])).toBe(aliveEnemy);
  });

  test('returns null when no enemy remains', () => {
    const self = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const ally = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 1);

    expect(findNearestEnemy(self, [self, ally])).toBeNull();
  });
});

describe('findPath — simple movement without obstacle', () => {
  test('moves in a straight (diagonal) line toward the target', () => {
    const grid = new Grid(10, 10);
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);

    const path = findPath(unit, 3, 3, grid, [unit]);

    expect(path).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);
  });

  test('takes a purely horizontal straight line when the target has no vertical offset', () => {
    const grid = new Grid(10, 10);
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 5);

    const path = findPath(unit, 5, 5, grid, [unit]);

    expect(path).toEqual([
      { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
    ]);
  });

  test('never takes more steps than the Chebyshev distance (shortest path, no superfluous detour)', () => {
    const grid = new Grid(20, 20);
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 2, 2);

    const path = findPath(unit, 9, 5, grid, [unit]);

    expect(path.length).toBe(chebyshevDistance(2, 2, 9, 5));
    expect(lastStep(path)).toEqual({ x: 9, y: 5 });
  });
});

describe('findPath — contournement d\'obstacle', () => {
  test('routes around a wall that blocks the direct line', () => {
    const grid = new Grid(5, 5, [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 },
    ]);
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 2);

    const path = findPath(unit, 4, 2, grid, [unit]);

    for (const step of path) {
      expect(grid.isObstacle(step.x, step.y)).toBe(false);
    }
    expect(lastStep(path)).toEqual({ x: 4, y: 2 });
  });
});

describe('findPath — blocage par une autre unité', () => {
  test('routes around a unit standing on the direct line', () => {
    const grid = new Grid(5, 5);
    const mover = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 2);
    const blocker = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 2, 2);

    const path = findPath(mover, 4, 2, grid, [mover, blocker]);

    for (const step of path) {
      expect(step).not.toEqual({ x: 2, y: 2 });
    }
    expect(lastStep(path)).toEqual({ x: 4, y: 2 });
  });
});

describe('findPath — bloc rigide 2x2 face à un couloir trop étroit', () => {
  // Mur en x=2 sur toute la hauteur de la grille, avec un unique passage
  // d'une case de large en y=3 : une unité normale passe, un bloc 2x2 non.
  // Espèce générique au sol (pas Fafnir : il est [Vol] et ignorerait ce mur de toute façon).
  const wallObstacles = [0, 1, 2, 4, 5, 6].map((y) => ({ x: 2, y }));
  const groundColossus = { keywords: [], size: 2, maxHp: 999 };

  test('a 1x1 unit crosses through the single-cell gap', () => {
    const grid = new Grid(6, 7, wallObstacles);
    const worm = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 3);

    const path = findPath(worm, 5, 3, grid, [worm]);

    expect(lastStep(path)).toEqual({ x: 5, y: 3 });
  });

  test('a 2x2 ground unit cannot fit through the same gap and stays on its side', () => {
    const grid = new Grid(6, 7, wallObstacles);
    const colossus = new Unit(groundColossus, 'player', 0, 3);

    const path = findPath(colossus, 5, 3, grid, [colossus]);

    expect(path.every((step) => step.x < 2)).toBe(true);
  });
});

describe('findPath — unité [Vol] traversant un obstacle de terrain', () => {
  // Mur complet en x=2, avec un unique passage en y=3 : une unité au sol
  // doit détourner par ce passage (chemin plus long), une unité [Vol] va tout droit.
  const wallObstacles = [0, 1, 2, 4, 5, 6].map((y) => ({ x: 2, y }));

  test('a flying unit ignores the terrain obstacle a ground unit must detour around', () => {
    const grid = new Grid(6, 7, wallObstacles);
    const groundUnit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const flyingUnit = new Unit(WYRMS_ROSTER.amphiptere, 'player', 0, 0);

    const groundPath = findPath(groundUnit, 5, 0, grid, [groundUnit]);
    const flyingPath = findPath(flyingUnit, 5, 0, grid, [flyingUnit]);

    expect(groundPath.some((step) => grid.isObstacle(step.x, step.y))).toBe(false);
    expect(lastStep(groundPath)).toEqual({ x: 5, y: 0 });

    expect(lastStep(flyingPath)).toEqual({ x: 5, y: 0 });
    expect(flyingPath.length).toBe(5); // droit au but, distance de Chebyshev exacte
    expect(groundPath.length).toBeGreaterThan(flyingPath.length); // forcé de détourner par le seul passage
  });

  test('a flying unit is still blocked by another unit occupying a cell', () => {
    const grid = new Grid(5, 5);
    const flyingUnit = new Unit(WYRMS_ROSTER.amphiptere, 'player', 0, 2);
    const blocker = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 2, 2);

    const path = findPath(flyingUnit, 4, 2, grid, [flyingUnit, blocker]);

    for (const step of path) {
      expect(step).not.toEqual({ x: 2, y: 2 });
    }
  });
});
