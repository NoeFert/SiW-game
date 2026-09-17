import Grid from '../../src/logic/grid.js';
import { BATTLEFIELD_OBSTACLES } from '../../src/data/battlefield.js';

describe('BATTLEFIELD_OBSTACLES (rules.md 1)', () => {
  test('exactement 8 obstacles, chacun dans les limites de la grille', () => {
    expect(BATTLEFIELD_OBSTACLES).toHaveLength(8);
    const grid = new Grid(24, 14, BATTLEFIELD_OBSTACLES);
    for (const { x, y } of BATTLEFIELD_OBSTACLES) {
      expect(grid.isInBounds(x, y)).toBe(true);
    }
  });

  test('aucune case en double', () => {
    const keys = new Set(BATTLEFIELD_OBSTACLES.map(({ x, y }) => `${x},${y}`));
    expect(keys.size).toBe(BATTLEFIELD_OBSTACLES.length);
  });
});
