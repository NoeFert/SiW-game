import {
  chebyshevDistance, findPath, footprint, occupiedCells, isPositionFree, DIRECTIONS,
} from './pathfinding.js';

function minDistanceBetweenFootprints(a, b) {
  let min = Infinity;
  for (const cellA of footprint(a.x, a.y, a.size)) {
    for (const cellB of footprint(b.x, b.y, b.size)) {
      const dist = chebyshevDistance(cellA.x, cellA.y, cellB.x, cellB.y);
      if (dist < min) min = dist;
    }
  }
  return min;
}

export function isAdjacent(a, b) {
  return minDistanceBetweenFootprints(a, b) === 1;
}

// rules.md 4.5 : jamais de tir sur une cible adjacente (portée minimale de 2 cases).
export function isInRange(attacker, target) {
  if (!attacker.species.range) return false;
  const dist = minDistanceBetweenFootprints(attacker, target);
  return dist > 1 && dist <= attacker.species.range;
}

// rules.md 4.2/4.3 : au moins une case libre autour de la cible (empreinte incluse) pour `mover`.
function hasFreeAdjacentSlot(target, aliveUnits, mover, grid) {
  const occupied = occupiedCells(aliveUnits, mover);
  const targetCells = new Set(footprint(target.x, target.y, target.size).map(({ x, y }) => `${x},${y}`));
  const candidates = new Set();
  for (const cell of footprint(target.x, target.y, target.size)) {
    for (const { dx, dy } of DIRECTIONS) {
      candidates.add(`${cell.x + dx},${cell.y + dy}`);
    }
  }
  for (const key of candidates) {
    if (targetCells.has(key)) continue;
    const [x, y] = key.split(',').map(Number);
    if (isPositionFree(x, y, mover.size, grid, occupied, mover.isFlying)) return true;
  }
  return false;
}

// rules.md 4.2 : cible par défaut = ennemi le plus proche ; une unité engagée au corps-à-corps
// garde sa cible. Une unité au corps-à-corps qui ne trouve aucune case libre sur l'ennemi le
// plus proche se redirige vers le suivant, et n'attend que s'il n'y a aucun autre ennemi.
export function chooseTarget(unit, aliveUnits, grid) {
  if (unit.target && unit.target.isAlive && unit.status === 'engaged') {
    return unit.target;
  }

  const enemies = aliveUnits.filter((u) => u.isAlive && u.faction !== unit.faction);
  if (enemies.length === 0) return null;

  const sorted = [...enemies].sort(
    (a, b) => chebyshevDistance(unit.x, unit.y, a.x, a.y) - chebyshevDistance(unit.x, unit.y, b.x, b.y),
  );

  if (unit.species.attackType !== 'melee') return sorted[0];

  const alreadyAdjacent = sorted.find((enemy) => isAdjacent(unit, enemy));
  if (alreadyAdjacent) return alreadyAdjacent;

  const reachable = sorted.find((enemy) => hasFreeAdjacentSlot(enemy, aliveUnits, unit, grid));
  return reachable ?? sorted[0];
}

function attackModeFor(unit, target) {
  const type = unit.species.attackType;
  if (type === 'hybrid') return isAdjacent(unit, target) ? 'melee' : 'ranged';
  return type;
}

function damageFor(unit, mode) {
  const damage = unit.species.damage;
  return typeof damage === 'object' ? damage[mode] : damage;
}

function queueAttack(unit, target, mode, deltaSeconds, pendingAttacks) {
  unit.attackTimer += deltaSeconds;
  while (unit.attackTimer >= unit.species.attackSpeed) {
    unit.attackTimer -= unit.species.attackSpeed;
    pendingAttacks.push({ attacker: unit, target, mode });
  }
}

function moveToward(unit, targetX, targetY, grid, aliveUnits, deltaSeconds) {
  unit.moveProgress += unit.species.moveSpeed * deltaSeconds;
  while (unit.moveProgress >= 1) {
    const path = findPath(unit, targetX, targetY, grid, aliveUnits);
    if (path.length === 0) {
      unit.moveProgress = 0;
      break;
    }
    unit.x = path[0].x;
    unit.y = path[0].y;
    unit.moveProgress -= 1;
  }
}

// rules.md 4.5 : une unité purement à distance ne recule que si sa cible devient adjacente.
function stepAwayFrom(unit, target, grid, aliveUnits, deltaSeconds) {
  unit.moveProgress += unit.species.moveSpeed * deltaSeconds;
  while (unit.moveProgress >= 1) {
    const dx = Math.sign(unit.x - target.x) || 1;
    const dy = Math.sign(unit.y - target.y) || 1;
    const nx = unit.x + dx;
    const ny = unit.y + dy;
    const occupied = occupiedCells(aliveUnits, unit);
    if (!isPositionFree(nx, ny, unit.size, grid, occupied, unit.isFlying)) {
      unit.moveProgress = 0;
      break;
    }
    unit.x = nx;
    unit.y = ny;
    unit.moveProgress -= 1;
  }
}

// units.md — aptitudes automatiques (section 6.1) : périodiques (tous les N coups portés) ou au coup fatal.
function applyPeriodicAbilities(attacker, target, baseDamage) {
  let damage = baseDamage;
  for (const ability of attacker.species.abilities ?? []) {
    if (ability.trigger !== 'periodic' || attacker.attacksLanded % ability.every !== 0) continue;
    if (ability.type === 'bonusDamage') damage *= ability.multiplier;
    if (ability.type === 'paralyze') target.paralyzedNextAttack = true;
  }
  return damage;
}

function applyOnKillAbilities(attacker) {
  for (const ability of attacker.species.abilities ?? []) {
    if (ability.trigger === 'onKill' && ability.type === 'heal') {
      attacker.hp = Math.min(attacker.species.maxHp, attacker.hp + ability.amount);
    }
  }
}

// rules.md 4.1 : toutes les attaques du tick sont calculées (queueAttack) avant d'être appliquées
// ici ensemble — aucune unité ne peut mourir "avant" une autre au sein du même tick.
function applyAttacks(pendingAttacks) {
  for (const { attacker, target, mode } of pendingAttacks) {
    if (attacker.paralyzedNextAttack) {
      attacker.paralyzedNextAttack = false;
      continue;
    }

    attacker.attacksLanded += 1;
    const damage = applyPeriodicAbilities(attacker, target, damageFor(attacker, mode));

    const wasAlive = target.isAlive;
    target.takeDamage(damage);
    if (wasAlive && !target.isAlive) applyOnKillAbilities(attacker);
  }
}

// Fait avancer la bataille de `deltaSeconds` : ciblage, mouvement, attaque (rules.md sections 4 et 6).
export function resolveCombatTick(units, grid, deltaSeconds) {
  const aliveUnits = units.filter((u) => u.isAlive);
  const pendingAttacks = [];

  for (const unit of aliveUnits) {
    const target = chooseTarget(unit, aliveUnits, grid);
    unit.target = target;

    if (!target) {
      unit.status = 'idle';
      continue;
    }

    const mode = attackModeFor(unit, target);

    if (mode === 'melee') {
      if (isAdjacent(unit, target)) {
        unit.status = 'engaged';
        queueAttack(unit, target, 'melee', deltaSeconds, pendingAttacks);
      } else {
        unit.status = 'moving';
        moveToward(unit, target.x, target.y, grid, aliveUnits, deltaSeconds);
      }
      continue;
    }

    // ranged (pure ou hybride pas encore au contact)
    if (isAdjacent(unit, target)) {
      unit.status = 'moving';
      stepAwayFrom(unit, target, grid, aliveUnits, deltaSeconds);
    } else if (isInRange(unit, target)) {
      unit.status = 'attacking';
      queueAttack(unit, target, 'ranged', deltaSeconds, pendingAttacks);
      if (unit.species.attackType === 'hybrid') {
        moveToward(unit, target.x, target.y, grid, aliveUnits, deltaSeconds);
      }
    } else {
      unit.status = 'moving';
      moveToward(unit, target.x, target.y, grid, aliveUnits, deltaSeconds);
    }
  }

  applyAttacks(pendingAttacks);
}
