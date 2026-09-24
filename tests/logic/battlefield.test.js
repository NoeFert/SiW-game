import Grid from '../../src/logic/grid.js';
import { BATTLEFIELD_OBSTACLES } from '../../src/data/battlefield.js';

function countDiagonalAdjacentPairs(obstacles) {
  let count = 0;
  for (let i = 0; i < obstacles.length; i++) {
    for (let j = i + 1; j < obstacles.length; j++) {
      const dx = Math.abs(obstacles[i].x - obstacles[j].x);
      const dy = Math.abs(obstacles[i].y - obstacles[j].y);
      if (dx === 1 && dy === 1) count += 1;
    }
  }
  return count;
}

describe('BATTLEFIELD_OBSTACLES (rules.md 1)', () => {
  test('exactement 16 obstacles, chacun dans les limites de la grille', () => {
    expect(BATTLEFIELD_OBSTACLES).toHaveLength(16);
    const grid = new Grid(24, 14, BATTLEFIELD_OBSTACLES);
    for (const { x, y } of BATTLEFIELD_OBSTACLES) {
      expect(grid.isInBounds(x, y)).toBe(true);
    }
  });

  test('aucune case en double', () => {
    const keys = new Set(BATTLEFIELD_OBSTACLES.map(({ x, y }) => `${x},${y}`));
    expect(keys.size).toBe(BATTLEFIELD_OBSTACLES.length);
  });

  test('au moins deux paires d\'obstacles adjacents en diagonale', () => {
    expect(countDiagonalAdjacentPairs(BATTLEFIELD_OBSTACLES)).toBeGreaterThanOrEqual(2);
  });
});
