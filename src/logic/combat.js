import {
  compareTargets, findPath, findPathToNearest, footprint, minDistanceBetweenFootprints, occupiedCells, isPositionFree, DIRECTIONS,
} from './pathfinding.js';

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
  if (unit.target && unit.target.isOnField && unit.status === 'engaged') {
    return unit.target;
  }

  const enemies = aliveUnits.filter((u) => u.isOnField && u.faction !== unit.faction);
  if (enemies.length === 0) return null;

  const sorted = [...enemies].sort((a, b) => compareTargets(unit, a, b));

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

// Avance case par case au rythme de la vitesse de déplacement, en redemandant le chemin à
// chaque case (`nextPath`). Renvoie false si l'unité ne peut plus progresser (déjà arrivée,
// ou au plus près possible).
function advance(unit, deltaSeconds, nextPath) {
  unit.moveProgress += unit.species.moveSpeed * deltaSeconds;
  while (unit.moveProgress >= 1) {
    const path = nextPath();
    if (path.length === 0) {
      unit.moveProgress = 0;
      return false;
    }
    unit.x = path[0].x;
    unit.y = path[0].y;
    unit.moveProgress -= 1;
  }
  return true;
}

function moveToward(unit, targetX, targetY, grid, aliveUnits, deltaSeconds) {
  return advance(unit, deltaSeconds, () => findPath(unit, targetX, targetY, grid, aliveUnits));
}

// rules.md 4.5 : unité purement à distance qui tire en avançant (ex : Athos) — elle continue
// d'approcher sa cible pendant qu'elle tire, mais s'arrête à 2 cases (portée minimale de tir) :
// un pas ne réduit la distance que d'une case, elle n'entre donc jamais au contact.
function advanceToMinRange(unit, target, grid, aliveUnits, deltaSeconds) {
  advance(unit, deltaSeconds, () => (
    minDistanceBetweenFootprints(unit, target) <= 2 ? [] : findPath(unit, target.x, target.y, grid, aliveUnits)
  ));
}

// rules.md 4.5 : une unité purement à distance ne recule que si sa cible devient adjacente —
// vers la case hors contact la plus proche, en contournant si le recul direct est bloqué
// (coin du terrain, obstacle, autre unité) plutôt que de rester collée sans pouvoir tirer.
function stepAwayFrom(unit, target, grid, aliveUnits, deltaSeconds) {
  const isOutOfContact = (x, y) => minDistanceBetweenFootprints({ x, y, size: unit.size }, target) > 1;
  advance(unit, deltaSeconds, () => findPathToNearest(unit, grid, aliveUnits, isOutOfContact));
}

// units.md — aptitudes automatiques (section 6.1) : périodiques (tous les N coups portés) ou au
// coup fatal. Renvoie aussi les aptitudes déclenchées (`triggered`), pour que la couche Phaser
// puisse en tirer un feedback visuel sans que combat.js sache quoi que ce soit du rendu.
// La paralysie n'est que signalée (`paralyzes`) : applyAttacks la pose après coup, pour qu'elle
// ne touche jamais une attaque du même tick (rules.md 4.1).
function applyPeriodicAbilities(attacker, target, baseDamage) {
  let damage = baseDamage;
  let paralyzes = false;
  const triggered = [];
  for (const ability of attacker.species.abilities ?? []) {
    if (ability.trigger !== 'periodic' || attacker.attacksLanded % ability.every !== 0) continue;
    if (ability.type === 'bonusDamage') {
      damage *= ability.multiplier;
      triggered.push({ type: 'bonusDamage', unit: attacker, target, damage });
    }
    if (ability.type === 'paralyze') {
      paralyzes = true;
      triggered.push({ type: 'paralyze', unit: target });
    }
  }
  return { damage, paralyzes, triggered };
}

function applyOnKillAbilities(attacker) {
  let healed = 0;
  for (const ability of attacker.species.abilities ?? []) {
    if (ability.trigger === 'onKill' && ability.type === 'heal') {
      const before = attacker.hp;
      attacker.hp = Math.min(attacker.species.maxHp, attacker.hp + ability.amount);
      healed += attacker.hp - before;
    }
  }
  return healed;
}

function isOnEdge(x, y, size, grid) {
  return footprint(x, y, size).some(
    ({ x: cx, y: cy }) => cx === 0 || cy === 0 || cx === grid.width - 1 || cy === grid.height - 1,
  );
}

// rules.md 5 : la fuite est toujours possible immédiatement, même engagée au corps-à-corps —
// chaque ennemi alors engagé sur elle porte une dernière attaque au désengagement (une seule
// fois, au premier tick de fuite), hors de son propre timer d'attaque et sans compter pour les
// aptitudes (`free`, rules.md 6.1). La fuite vise la case de bord atteignable la plus proche,
// n'importe laquelle : un bord bloqué est contourné. Aucun bord atteignable : l'unité reste en
// fuite sur place et riposte au corps-à-corps (sauf unité purement à distance) jusqu'à ce qu'un
// chemin se libère ; `target` n'est posée que pendant cette riposte.
function processFlee(unit, grid, aliveUnits, deltaSeconds, pendingAttacks) {
  if (unit.status !== 'fleeing') {
    for (const enemy of aliveUnits) {
      if (enemy.faction !== unit.faction && enemy.status === 'engaged' && enemy.target === unit) {
        pendingAttacks.push({ attacker: enemy, target: unit, mode: 'melee', free: true });
      }
    }
  }

  unit.status = 'fleeing';
  const onEdge = (x, y) => isOnEdge(x, y, unit.size, grid);
  if (!onEdge(unit.x, unit.y) && findPathToNearest(unit, grid, aliveUnits, onEdge).length === 0) {
    const adjacentEnemies = aliveUnits.filter((e) => e.faction !== unit.faction && isAdjacent(unit, e));
    unit.target = unit.species.attackType === 'ranged'
      ? null
      : adjacentEnemies.sort((a, b) => compareTargets(unit, a, b))[0] ?? null;
    if (unit.target) queueAttack(unit, unit.target, 'melee', deltaSeconds, pendingAttacks);
    return;
  }

  unit.target = null;
  advance(unit, deltaSeconds, () => findPathToNearest(unit, grid, aliveUnits, onEdge));

  if (onEdge(unit.x, unit.y)) {
    unit.hasFled = true;
    unit.command = null;
  }
}

// rules.md 5 : "se déplacer" ignore le combat autonome tant que la destination n'est pas atteinte.
// Une destination inatteignable (obstacle, bloc 2x2 qui déborderait de la grille, case occupée)
// termine la commande au plus près possible, sinon l'unité resterait figée sans riposter.
function processMoveCommand(unit, grid, aliveUnits, deltaSeconds) {
  const { x, y } = unit.command;
  if (unit.x === x && unit.y === y) {
    unit.command = null;
    unit.status = 'idle';
    return;
  }
  unit.status = 'moving';
  const canProgress = moveToward(unit, x, y, grid, aliveUnits, deltaSeconds);
  if (!canProgress || (unit.x === x && unit.y === y)) unit.command = null;
}

// rules.md 4.1 : toutes les attaques du tick sont calculées (queueAttack) avant d'être appliquées
// ici ensemble — aucune unité ne peut mourir "avant" une autre au sein du même tick. Renvoie la
// liste des évènements d'aptitude déclenchés ce tick (voir applyPeriodicAbilities), plus un
// évènement 'rangedAttack' par tir à distance porté (rules.md 4.5), pour un éventuel feedback
// visuel côté Phaser — combat.js ne sait rien du rendu lui-même.
// Le résultat ne dépend jamais de l'ordre des attaques dans la liste : une paralysie posée ce
// tick ne vise que la prochaine attaque (tick suivant), et quand plusieurs attaques du même
// tick tuent une cible, chacun de ces attaquants compte comme ayant porté le coup fatal —
// sauf s'il meurt lui-même ce tick (un mort ne se soigne pas).
function applyAttacks(pendingAttacks) {
  const events = [];
  const landed = [];
  const toParalyze = [];

  for (const { attacker, target, mode, free } of pendingAttacks) {
    if (attacker.paralyzedNextAttack) {
      attacker.paralyzedNextAttack = false;
      events.push({ type: 'missed', unit: attacker });
      continue;
    }

    if (mode === 'ranged') events.push({ type: 'rangedAttack', unit: attacker, target });
    const baseDamage = damageFor(attacker, mode);
    if (!free) attacker.attacksLanded += 1;
    const { damage, paralyzes, triggered } = free
      ? { damage: baseDamage, paralyzes: false, triggered: [] }
      : applyPeriodicAbilities(attacker, target, baseDamage);
    events.push(...triggered);
    if (paralyzes) toParalyze.push(target);
    landed.push({ attacker, target, damage, targetWasAlive: target.isAlive });
  }

  for (const { target, damage } of landed) target.takeDamage(damage);
  for (const target of toParalyze) target.paralyzedNextAttack = true;

  const credited = new Set();
  for (const { attacker, target, targetWasAlive } of landed) {
    const key = `${attacker.id}->${target.id}`;
    if (!targetWasAlive || target.isAlive || !attacker.isAlive || credited.has(key)) continue;
    credited.add(key);
    const healed = applyOnKillAbilities(attacker);
    if (healed > 0) events.push({ type: 'heal', unit: attacker, amount: healed });
  }

  return events;
}

// Fait avancer la bataille de `deltaSeconds` : commandes, ciblage, mouvement, attaque
// (rules.md sections 4, 5 et 6). Une unité sans commande garde son comportement autonome.
// Renvoie les évènements d'aptitude déclenchés ce tick (voir applyAttacks).
export function resolveCombatTick(units, grid, deltaSeconds) {
  const aliveUnits = units.filter((u) => u.isOnField);
  const pendingAttacks = [];

  // rules.md 4.1 : les unités en fuite bougent en dernier — toutes les autres décident de leurs
  // attaques en les voyant encore à leur place, quel que soit l'ordre des unités.
  const isFleeing = (u) => u.command?.type === 'flee';
  const processingOrder = [...aliveUnits.filter((u) => !isFleeing(u)), ...aliveUnits.filter(isFleeing)];

  for (const unit of processingOrder) {
    // Le timer d'attaque ne court que pendant un échange de coups : une unité qui arrive au
    // contact ou à portée repart de zéro, sans frappe instantanée héritée d'un combat précédent.
    // Une unité en fuite qui riposte (rules.md 5) garde elle aussi son rythme d'un tick à l'autre.
    const isTrading = unit.status === 'engaged' || unit.status === 'attacking'
      || (unit.status === 'fleeing' && unit.target);
    if (!isTrading) unit.attackTimer = 0;

    if (unit.command?.type === 'flee') {
      processFlee(unit, grid, aliveUnits, deltaSeconds, pendingAttacks);
      continue;
    }

    if (unit.command?.type === 'moveTo') {
      processMoveCommand(unit, grid, aliveUnits, deltaSeconds);
      continue;
    }

    if (unit.command?.type === 'attack' && !unit.command.target.isOnField) {
      unit.command = null; // cible morte/enfuie : la commande se termine, retour à l'autonome
    }

    const target = unit.command?.type === 'attack' ? unit.command.target : chooseTarget(unit, aliveUnits, grid);
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
      } else if (unit.species.firesWhileMoving) {
        advanceToMinRange(unit, target, grid, aliveUnits, deltaSeconds);
      }
    } else {
      unit.status = 'moving';
      moveToward(unit, target.x, target.y, grid, aliveUnits, deltaSeconds);
    }
  }

  return applyAttacks(pendingAttacks);
}
