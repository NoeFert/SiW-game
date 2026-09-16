const DEFAULT_WIDTH = 24;
const DEFAULT_HEIGHT = 14;

export default class Grid {
  constructor(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, obstacles = []) {
    this.width = width;
    this.height = height;
    this.obstacles = new Set(obstacles.map(({ x, y }) => `${x},${y}`));
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
