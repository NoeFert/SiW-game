import Grid from '../../src/logic/grid.js';
import { DIRECTIONS } from '../../src/logic/pathfinding.js';
import { BATTLEFIELD_OBSTACLES } from '../../src/data/battlefield.js';

const grid = new Grid(24, 14, BATTLEFIELD_OBSTACLES);

function cellsOf({ x, y, size = 1 }) {
  const cells = [];
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) cells.push({ x: x + dx, y: y + dy });
  }
  return cells;
}

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
  test('16 obstacles : 12 d\'une case et 4 blocs 2x2, entièrement dans la grille', () => {
    expect(BATTLEFIELD_OBSTACLES).toHaveLength(16);
    expect(BATTLEFIELD_OBSTACLES.filter((o) => o.size === 2)).toHaveLength(4);
    for (const cell of BATTLEFIELD_OBSTACLES.flatMap(cellsOf)) {
      expect(grid.isInBounds(cell.x, cell.y)).toBe(true);
    }
  });

  test('aucune case partagée entre deux obstacles', () => {
    const cells = BATTLEFIELD_OBSTACLES.flatMap(cellsOf);
    const keys = new Set(cells.map(({ x, y }) => `${x},${y}`));
    expect(keys.size).toBe(cells.length);
  });

  test('symétrique de part et d\'autre de la ligne médiane', () => {
    for (const { x, y } of BATTLEFIELD_OBSTACLES.flatMap(cellsOf)) {
      expect(grid.isObstacle(23 - x, y)).toBe(true);
    }
  });

  test('couloir central (colonnes 10-13) et bords haut/bas (rangées 0-1, 12-13) dégagés', () => {
    for (const { x, y } of BATTLEFIELD_OBSTACLES.flatMap(cellsOf)) {
      expect(x >= 10 && x <= 13).toBe(false);
      expect(y <= 1 || y >= 12).toBe(false);
    }
  });

  test('aucune zone fermée : toute case libre est atteignable par une unité au sol', () => {
    const start = '0,0';
    const seen = new Set([start]);
    const queue = [{ x: 0, y: 0 }];
    for (let i = 0; i < queue.length; i++) {
      for (const { dx, dy } of DIRECTIONS) {
        const nx = queue[i].x + dx;
        const ny = queue[i].y + dy;
        const key = `${nx},${ny}`;
        if (!seen.has(key) && grid.isFree(nx, ny)) {
          seen.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
    }
    const freeCells = grid.width * grid.height - BATTLEFIELD_OBSTACLES.flatMap(cellsOf).length;
    expect(seen.size).toBe(freeCells);
  });

  test('au moins deux paires d\'obstacles adjacents en diagonale', () => {
    expect(countDiagonalAdjacentPairs(BATTLEFIELD_OBSTACLES)).toBeGreaterThanOrEqual(2);
  });
});
