// Convertit un plan ASCII (une chaîne par rangée) en liste d'obstacles : '#' = rocher d'une
// case, '@' = rocher 2x2 (bloc de 4 '@' dont le coin haut-gauche est lu en premier), tout
// autre caractère = case libre. Sert à écrire les zones de bataille lisiblement (src/data/).
export function parseObstacleMap(rows) {
  const obstacles = [];
  const taken = new Set();
  rows.forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell === '#') obstacles.push({ x, y });
    if (cell === '@' && !taken.has(`${x},${y}`)) {
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        if (rows[y + dy]?.[x + dx] !== '@') throw new Error(`Rocher 2x2 incomplet en (${x}, ${y})`);
        taken.add(`${x + dx},${y + dy}`);
      }
      obstacles.push({ x, y, size: 2 });
    }
  }));
  return obstacles;
}

const DEFAULT_WIDTH = 24;
const DEFAULT_HEIGHT = 14;

export default class Grid {
  constructor(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, obstacles = []) {
    this.width = width;
    this.height = height;
    // Un obstacle occupe un bloc carré de `size` cases (1 par défaut) à partir de son coin haut-gauche.
    this.obstacles = new Set();
    for (const { x, y, size = 1 } of obstacles) {
      for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) this.obstacles.add(`${x + dx},${y + dy}`);
      }
    }
  }

  isInBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  isObstacle(x, y) {
    return this.obstacles.has(`${x},${y}`);
  }

  isFree(x, y) {
    return this.isInBounds(x, y) && !this.isObstacle(x, y);
  }
}
