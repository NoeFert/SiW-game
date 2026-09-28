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
    const dist = minDistanceBetweenFootprints(unit, other);
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

// rules.md 3 : distance entre les cases les plus proches de deux unités (2x2 comprises).
export function minDistanceBetweenFootprints(a, b) {
  let min = Infinity;
  for (const cellA of footprint(a.x, a.y, a.size)) {
    for (const cellB of footprint(b.x, b.y, b.size)) {
      const dist = chebyshevDistance(cellA.x, cellA.y, cellB.x, cellB.y);
      if (dist < min) min = dist;
    }
  }
  return min;
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

// Chemin le plus court (parcours en largeur, 8 directions à coût uniforme) de la position de
// `unit` vers la case libre la plus proche qui satisfait `isGoal(x, y)` (coin haut-gauche pour
// un bloc 2x2). Tableau vide si `unit` y est déjà, ou si aucune case de ce type n'est
// atteignable. Utile quand la destination n'est pas un point précis mais une condition
// (n'importe quel bord pour la fuite, n'importe quelle case hors contact pour un recul).
export function findPathToNearest(unit, grid, units, isGoal) {
  if (isGoal(unit.x, unit.y)) return [];
  const occupied = occupiedCells(units, unit);
  const startKey = `${unit.x},${unit.y}`;
  const cameFrom = new Map([[startKey, null]]);
  const queue = [{ x: unit.x, y: unit.y }];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const { dx, dy } of DIRECTIONS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;
      if (cameFrom.has(key)) continue;
      if (!isPositionFree(nx, ny, unit.size, grid, occupied, unit.isFlying)) continue;
      cameFrom.set(key, `${current.x},${current.y}`);
      if (isGoal(nx, ny)) {
        const path = [];
        for (let k = key; k !== startKey; k = cameFrom.get(k)) path.unshift(parseKey(k));
        return path;
      }
      queue.push({ x: nx, y: ny });
    }
  }
  return [];
}

function parseKey(key) {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

// Chemin le plus court (A*, coin haut-gauche pour un bloc 2x2) de la position de `unit` vers
// la case libre atteignable la plus proche de (targetX, targetY), en contournant les
// obstacles (ignorés si [Vol]) et les autres unités. Tableau vide si `unit` est déjà au plus
// près possible (bloquée ou déjà arrivée). La distance de Chebyshev est un coût exact (pas
// juste admissible) pour un déplacement 8 directions à coût uniforme : A* n'explore donc que
// les cases utiles à un chemin optimal, jamais toute la carte comme le ferait un simple BFS.
export function findPath(unit, targetX, targetY, grid, units) {
  const occupied = occupiedCells(units, unit);
  const ignoreTerrainObstacles = unit.isFlying;
  const size = unit.size;
  const startX = unit.x;
  const startY = unit.y;

  // Départage les cases à coût réel égal en faveur de celles les plus proches de la ligne
  // droite start->cible (produit spontanément une ligne droite/diagonale plutôt qu'un
  // "escalier" arbitraire). Poids minuscule : ne peut jamais rendre un chemin plus long
  // préférable à un chemin plus court, seulement départager une vraie égalité de coût.
  const dxLine = targetX - startX;
  const dyLine = targetY - startY;
  const lineBias = (x, y) => Math.abs(dxLine * (y - startY) - dyLine * (x - startX)) * 0.001;

  const startKey = `${startX},${startY}`;
  const gScore = new Map([[startKey, 0]]);
  const cameFrom = new Map();
  const openF = new Map([[startKey, chebyshevDistance(startX, startY, targetX, targetY)]]);
  const closed = new Set();

  let bestKey = startKey;
  let bestDist = chebyshevDistance(startX, startY, targetX, targetY);
  let bestG = 0;

  while (openF.size > 0) {
    let currentKey = null;
    let currentF = Infinity;
    for (const [key, f] of openF) {
      if (f < currentF) {
        currentF = f;
        currentKey = key;
      }
    }
    openF.delete(currentKey);
    closed.add(currentKey);

    const { x: cx, y: cy } = parseKey(currentKey);
    const g = gScore.get(currentKey);
    const dist = chebyshevDistance(cx, cy, targetX, targetY);

    if (dist < bestDist || (dist === bestDist && g < bestG)) {
      bestKey = currentKey;
      bestDist = dist;
      bestG = g;
      if (dist === 0) break; // arrivée exacte : aucun chemin ne peut faire mieux
    }

    for (const { dx, dy } of DIRECTIONS) {
      const nx = cx + dx;
      const ny = cy + dy;
      const key = `${nx},${ny}`;
      if (closed.has(key)) continue;
      if (!isPositionFree(nx, ny, size, grid, occupied, ignoreTerrainObstacles)) continue;

      const tentativeG = g + 1;
      if (gScore.has(key) && tentativeG >= gScore.get(key)) continue;

      gScore.set(key, tentativeG);
      cameFrom.set(key, currentKey);
      openF.set(key, tentativeG + chebyshevDistance(nx, ny, targetX, targetY) + lineBias(nx, ny));
    }
  }

  if (bestKey === startKey) return [];

  const path = [];
  let key = bestKey;
  while (cameFrom.has(key)) {
    path.unshift(parseKey(key));
    key = cameFrom.get(key);
  }
  return path;
}
