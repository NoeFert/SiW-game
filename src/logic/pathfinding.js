export const DIRECTIONS = [
  { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
  { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
  { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 },
];

export function chebyshevDistance(x1, y1, x2, y2) {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

export function findNearestEnemy(unit, units) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const other of units) {
    if (other === unit || !other.isAlive || other.faction === unit.faction) continue;
    const dist = chebyshevDistance(unit.x, unit.y, other.x, other.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = other;
    }
  }
  return nearest;
}

// Cases occupées par une unité selon sa position (coin haut-gauche) et sa taille (1 ou 2x2).
export function footprint(x, y, size) {
  const cells = [];
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      cells.push({ x: x + dx, y: y + dy });
    }
  }
  return cells;
}

export function occupiedCells(units, excludeUnit) {
  const occupied = new Set();
  for (const other of units) {
    if (other === excludeUnit || !other.isAlive) continue;
    for (const { x, y } of footprint(other.x, other.y, other.size)) {
      occupied.add(`${x},${y}`);
    }
  }
  return occupied;
}

export function isPositionFree(x, y, size, grid, occupied, ignoreTerrainObstacles) {
  for (const cell of footprint(x, y, size)) {
    if (!grid.isInBounds(cell.x, cell.y)) return false;
    if (!ignoreTerrainObstacles && grid.isObstacle(cell.x, cell.y)) return false;
    if (occupied.has(`${cell.x},${cell.y}`)) return false;
  }
  return true;
}

// Chemin (liste de cases, coin haut-gauche pour un bloc 2x2) de la position de `unit`
// vers la case libre atteignable la plus proche de (targetX, targetY), en contournant
// les obstacles (ignorés si [Vol]) et les autres unités. Tableau vide si `unit` est
// déjà au plus près possible (bloquée ou déjà arrivée).
export function findPath(unit, targetX, targetY, grid, units) {
  const occupied = occupiedCells(units, unit);
  const ignoreTerrainObstacles = unit.isFlying;
  const size = unit.size;

  const startKey = `${unit.x},${unit.y}`;
  const visited = new Map([[startKey, { x: unit.x, y: unit.y, prevKey: null, dist: 0 }]]);
  const queue = [startKey];

  let bestKey = startKey;
  let bestDist = chebyshevDistance(unit.x, unit.y, targetX, targetY);
  let bestPathLen = 0;

  for (let i = 0; i < queue.length; i++) {
    const currentKey = queue[i];
    const current = visited.get(currentKey);

    for (const { dx, dy } of DIRECTIONS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (!isPositionFree(nx, ny, size, grid, occupied, ignoreTerrainObstacles)) continue;

      const pathLen = current.dist + 1;
      visited.set(key, { x: nx, y: ny, prevKey: currentKey, dist: pathLen });
      queue.push(key);

      const dist = chebyshevDistance(nx, ny, targetX, targetY);
      if (dist < bestDist || (dist === bestDist && pathLen < bestPathLen)) {
        bestDist = dist;
        bestKey = key;
        bestPathLen = pathLen;
      }
    }
  }

  if (bestKey === startKey) return [];

  const path = [];
  let step = visited.get(bestKey);
  while (step.prevKey !== null) {
    path.unshift({ x: step.x, y: step.y });
    step = visited.get(step.prevKey);
  }
  return path;
}
