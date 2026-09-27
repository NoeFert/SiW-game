import Grid from '../../src/logic/grid.js';

describe('Grid', () => {
  test('default dimensions match the v1 battlefield (24x14)', () => {
    const grid = new Grid();
    expect(grid.width).toBe(24);
    expect(grid.height).toBe(14);
  });

  test('accepts custom dimensions', () => {
    const grid = new Grid(5, 3);
    expect(grid.width).toBe(5);
    expect(grid.height).toBe(3);
  });

  describe('isInBounds', () => {
    const grid = new Grid(5, 3);

    test('true for cells within range', () => {
      expect(grid.isInBounds(0, 0)).toBe(true);
      expect(grid.isInBounds(4, 2)).toBe(true);
      expect(grid.isInBounds(2, 1)).toBe(true);
    });

    test('false for negative coordinates', () => {
      expect(grid.isInBounds(-1, 0)).toBe(false);
      expect(grid.isInBounds(0, -1)).toBe(false);
    });

    test('false for coordinates at or beyond width/height', () => {
      expect(grid.isInBounds(5, 0)).toBe(false);
      expect(grid.isInBounds(0, 3)).toBe(false);
    });
  });

  describe('isObstacle', () => {
    test('true only for configured obstacle cells', () => {
      const grid = new Grid(5, 3, [{ x: 2, y: 1 }]);
      expect(grid.isObstacle(2, 1)).toBe(true);
      expect(grid.isObstacle(0, 0)).toBe(false);
    });

    test('an obstacle with size 2 blocks its whole 2x2 square from its top-left corner', () => {
      const grid = new Grid(5, 3, [{ x: 1, y: 0, size: 2 }]);
      for (const [x, y] of [[1, 0], [2, 0], [1, 1], [2, 1]]) expect(grid.isObstacle(x, y)).toBe(true);
      expect(grid.isObstacle(3, 0)).toBe(false);
      expect(grid.isObstacle(1, 2)).toBe(false);
    });

    test('no obstacles by default', () => {
      const grid = new Grid(5, 3);
      expect(grid.isObstacle(0, 0)).toBe(false);
    });
  });

  describe('isFree', () => {
    const grid = new Grid(5, 3, [{ x: 2, y: 1 }]);

    test('false on an obstacle cell', () => {
      expect(grid.isFree(2, 1)).toBe(false);
    });

    test('false outside the grid', () => {
      expect(grid.isFree(-1, 0)).toBe(false);
      expect(grid.isFree(5, 0)).toBe(false);
    });

    test('true on an in-bounds, non-obstacle cell', () => {
      expect(grid.isFree(0, 0)).toBe(true);
    });
  });
});
