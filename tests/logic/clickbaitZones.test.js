import Grid, { parseObstacleMap } from '../../src/logic/grid.js';
import { DIRECTIONS, canStep } from '../../src/logic/pathfinding.js';
import {
  WALL_ZONE_MAP, LANES_ZONE_MAP, FORT_ZONE_MAP,
  WALL_ZONE_OBSTACLES, LANES_ZONE_OBSTACLES, FORT_ZONE_OBSTACLES,
} from '../../src/data/battlefield.js';

// Zones de la bataille-clickbait (rules.md 7.3) : chaque plan doit jouer son rôle (mur, couloirs,
// fort) sans fuite. Même règle de déplacement que le jeu (`canStep`) : 8 directions, sans jamais
// couper le coin d'un rocher (rules.md 3).
const W = 24;
const H = 14;
const NO_UNITS = new Set();

// Cases (coin haut-gauche) atteignables par un bloc de `size` cases depuis `start`. `closed` :
// cases rendues infranchissables en plus ; `allowed(x, y)` : cases où le bloc a le droit d'aller.
function reachable(obstacles, start, size, { closed = [], allowed = () => true } = {}) {
  const grid = new Grid(W, H, [...obstacles, ...closed]);
  const fits = (from, dx, dy) => canStep(from.x, from.y, dx, dy, size, grid, NO_UNITS, false)
    && [...Array(size * size)].every((_, i) => allowed(from.x + dx + (i % size), from.y + dy + Math.floor(i / size)));
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    for (const { dx, dy } of DIRECTIONS) {
      const next = { x: queue[i].x + dx, y: queue[i].y + dy };
      const key = `${next.x},${next.y}`;
      if (!seen.has(key) && fits(queue[i], dx, dy)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return seen;
}

// Une unité partie de la colonne 0 atteint-elle le bord d'entrée de l'IA (colonne 23) ?
function crossesField(obstacles, size, options) {
  const seen = reachable(obstacles, { x: 0, y: 5 }, size, options);
  return [...seen].some((key) => Number(key.split(',')[0]) === W - size);
}

const cells = (xs, ys) => xs.flatMap((x) => ys.map((y) => ({ x, y })));

describe('parseObstacleMap', () => {
  test('lit les rochers d\'une case et les rochers 2x2', () => {
    expect(parseObstacleMap(['#.@@', '..@@'])).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0, size: 2 }]);
  });

  test('refuse un rocher 2x2 incomplet', () => {
    expect(() => parseObstacleMap(['@@', '@.'])).toThrow();
  });
});

describe.each([
  ['Le mur', WALL_ZONE_MAP, WALL_ZONE_OBSTACLES],
  ['Les trois couloirs', LANES_ZONE_MAP, LANES_ZONE_OBSTACLES],
  ['Le fort', FORT_ZONE_MAP, FORT_ZONE_OBSTACLES],
])('zone "%s" — règles communes', (_, map, obstacles) => {
  test('plan de 24 x 14 cases', () => {
    expect(map).toHaveLength(H);
    for (const row of map) expect(row).toHaveLength(W);
  });

  test('bord d\'entrée de l\'IA (colonne 23) entièrement libre (rules.md 7.2)', () => {
    const grid = new Grid(W, H, obstacles);
    for (let y = 0; y < H; y++) expect(grid.isObstacle(W - 1, y)).toBe(false);
  });

  test('aucune zone isolée : toute case libre est atteignable', () => {
    const grid = new Grid(W, H, obstacles);
    const free = W * H - grid.obstacles.size;
    expect(reachable(obstacles, { x: 0, y: 0 }, 1).size).toBe(free);
  });

  test('une Légendaire 2x2 peut traverser la zone', () => {
    expect(crossesField(obstacles, 2)).toBe(true);
  });
});

describe('zone "Le mur" (phase 2)', () => {
  const narrow = cells([13, 14, 15, 16, 17, 18], [3]);
  const wide = cells([13, 14, 15, 16, 17, 18], [10, 11]);

  test('mur étanche : les deux passages fermés, plus aucune traversée', () => {
    expect(crossesField(WALL_ZONE_OBSTACLES, 1, { closed: [...narrow, ...wide] })).toBe(false);
  });

  test('passage étroit : une unité d\'une case passe, une Légendaire 2x2 non', () => {
    expect(crossesField(WALL_ZONE_OBSTACLES, 1, { closed: wide })).toBe(true);
    expect(crossesField(WALL_ZONE_OBSTACLES, 2, { closed: wide })).toBe(false);
  });
});

describe('zone "Les trois couloirs" (réserve)', () => {
  const betweenRidges = (x) => x >= 5 && x <= 19;

  test('entre les crêtes, aucun passage d\'un couloir à l\'autre au sol', () => {
    const top = reachable(LANES_ZONE_OBSTACLES, { x: 12, y: 1 }, 1, { allowed: betweenRidges });
    const middle = reachable(LANES_ZONE_OBSTACLES, { x: 12, y: 6 }, 1, { allowed: betweenRidges });
    expect(top.has('12,6')).toBe(false);
    expect(middle.has('12,12')).toBe(false);
  });

  test.each([['haut', 0, 0, 4], ['milieu', 6, 5, 8], ['bas', 11, 9, 13]])(
    'une Légendaire 2x2 parcourt le couloir du %s sans en sortir',
    (lane, y, minY, maxY) => {
      const inLane = (cx, cy) => cy >= minY && cy <= maxY;
      expect(reachable(LANES_ZONE_OBSTACLES, { x: 0, y }, 2, { allowed: inLane }).has(`22,${y}`)).toBe(true);
    },
  );
});

describe('zone "Le fort" (phase 3)', () => {
  const entrance = cells([9], [6, 7]);

  test('une Légendaire 2x2 peut entrer dans le fort', () => {
    expect(reachable(FORT_ZONE_OBSTACLES, { x: 12, y: 6 }, 2).has('5,6')).toBe(true);
  });

  test('fort étanche : entrée fermée, l\'intérieur est coupé du reste', () => {
    const inside = reachable(FORT_ZONE_OBSTACLES, { x: 6, y: 6 }, 1, { closed: entrance });
    expect(inside.has('12,6')).toBe(false);
  });
});
