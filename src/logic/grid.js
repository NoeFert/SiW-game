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
