// Outil de debug temporaire : affiche l'état d'une bataille en ASCII dans le terminal.
// Pas une fonctionnalité du jeu — sert uniquement à vérifier la logique sans Phaser.
import Grid from '../logic/grid.js';
import Unit from '../logic/unit.js';
import { footprint } from '../logic/pathfinding.js';
import { resolveCombatTick } from '../logic/combat.js';
import { createCommandState, commandFlee } from '../logic/commands.js';
import { WYRMS_ROSTER } from '../data/wyrmsRoster.js';

const SYMBOLS = {
  'Lambton Worm': 'L',
  'Amphiptère': 'A',
  'Fafnir the Cursed One': 'F',
};

function symbolFor(unit) {
  const base = SYMBOLS[unit.species.name] ?? '?';
  return unit.faction === 'player' ? base.toUpperCase() : base.toLowerCase();
}

export function renderGrid(grid, units) {
  const cells = Array.from({ length: grid.height }, () => Array(grid.width).fill('.'));

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.isObstacle(x, y)) cells[y][x] = '#';
    }
  }

  for (const unit of units) {
    if (!unit.isOnField) continue; // morte ou a fui : plus sur le terrain
    const symbol = symbolFor(unit);
    for (const { x, y } of footprint(unit.x, unit.y, unit.size)) {
      if (grid.isInBounds(x, y)) cells[y][x] = symbol;
    }
  }

  return cells.map((row) => row.join(' ')).join('\n');
}

export function renderUnitList(units) {
  return units
    .filter((unit) => unit.isAlive)
    .map((unit) => {
      const symbol = symbolFor(unit);
      const where = unit.hasFled ? 'OFF FIELD (fled)' : `pos (${unit.x},${unit.y})`;
      return `[${symbol}] #${unit.id} ${unit.species.name} (${unit.faction}) — ` +
        `HP ${unit.hp}/${unit.species.maxHp} — ${where} — status: ${unit.status}`;
    })
    .join('\n');
}

export function printBattle(grid, units) {
  console.log(renderGrid(grid, units));
  console.log('');
  console.log(renderUnitList(units));
}

// Bataille de démo : quelques Wyrms placés à la main, avec un "ennemi" (même roster,
// faute de roster Undead pour l'instant) pour vérifier la convention majuscule/minuscule.
function buildSampleBattle() {
  const grid = new Grid(24, 14, [
    { x: 10, y: 5 }, { x: 10, y: 6 }, { x: 14, y: 8 },
  ]);

  const units = [
    new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 3, 5),
    new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 3, 8),
    new Unit(WYRMS_ROSTER.amphiptere, 'player', 5, 2),
    new Unit(WYRMS_ROSTER.fafnir, 'player', 2, 10), // occupe (2,10)-(3,11)
    new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 18, 6),
  ];

  return { grid, units };
}

// Déroule quelques ticks pour observer le comportement autonome ET l'effet d'une commande
// manuelle (ici : fuite) — modifie librement pour tester une autre commande/scénario.
function runDemo() {
  const { grid, units } = buildSampleBattle();
  const commandState = createCommandState();

  console.log('=== t=0s (état initial) ===');
  printBattle(grid, units);

  const fleeingUnit = units.find((u) => u.x === 3 && u.y === 8);
  console.log(`\n--- commande : fuite pour l'unité #${fleeingUnit.id} (Lambton Worm en (3,8)) ---`);
  commandFlee(commandState, 0, fleeingUnit);

  for (let tick = 1; tick <= 3; tick++) {
    resolveCombatTick(units, grid, 1);
    console.log(`\n=== t=${tick}s ===`);
    printBattle(grid, units);
  }
}

runDemo();
