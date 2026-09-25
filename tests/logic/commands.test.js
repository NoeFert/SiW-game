import Grid from '../../src/logic/grid.js';
import Unit from '../../src/logic/unit.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { resolveCombatTick } from '../../src/logic/combat.js';
import {
  createCommandState, commandAttack, commandMoveTo, commandFlee, COMMAND_COOLDOWN_SECONDS,
} from '../../src/logic/commands.js';

describe('commandAttack — override du comportement autonome (rules.md 5)', () => {
  test('force le ciblage d\'un ennemi précis même si un autre est plus proche', () => {
    const grid = new Grid(20, 20);
    const state = createCommandState();
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const closeEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 1, 0); // adjacent, ciblé par défaut
    const farEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 10, 0);

    expect(commandAttack(state, 0, unit, farEnemy)).toBe(true);
    resolveCombatTick([unit, closeEnemy, farEnemy], grid, 0.5);

    expect(unit.target).toBe(farEnemy);
    expect(closeEnemy.hp).toBe(closeEnemy.species.maxHp); // pas engagée malgré l'adjacence
  });
});

describe('commandMoveTo (rules.md 5)', () => {
  test('déplace l\'unité vers la case désignée puis termine la commande à l\'arrivée', () => {
    const grid = new Grid(20, 20);
    const state = createCommandState();
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0); // vitesse 2.5 cases/s

    expect(commandMoveTo(state, 0, unit, 5, 0)).toBe(true);

    resolveCombatTick([unit], grid, 1); // 2,5 cases : pas encore arrivé
    expect(unit.command).not.toBeNull();
    expect(unit.x).toBeGreaterThan(0);
    expect(unit.x).toBeLessThan(5);

    resolveCombatTick([unit], grid, 5); // largement de quoi finir le trajet
    expect(unit.x).toBe(5);
    expect(unit.y).toBe(0);
    expect(unit.command).toBeNull();
  });

  test('destination sur un obstacle : s\'arrête au plus près puis reprend le combat autonome', () => {
    const grid = new Grid(20, 20, [{ x: 5, y: 0 }]);
    const state = createCommandState();
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const enemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 10, 5);

    commandMoveTo(state, 0, unit, 5, 0);
    for (let i = 0; i < 60; i++) resolveCombatTick([unit, enemy], grid, 0.1);

    expect(unit.command).toBeNull();
    expect(enemy.hp).toBeLessThan(enemy.species.maxHp); // a repris le combat
  });

  test('bloc 2x2 envoyé sur la dernière colonne (il n\'y tient pas) : la commande se termine', () => {
    const grid = new Grid(20, 20);
    const state = createCommandState();
    const fafnir = new Unit(WYRMS_ROSTER.fafnir, 'player', 10, 5);

    commandMoveTo(state, 0, fafnir, 19, 5);
    for (let i = 0; i < 60; i++) resolveCombatTick([fafnir], grid, 0.1);

    expect(fafnir.x).toBe(18); // au plus près possible
    expect(fafnir.command).toBeNull();
  });
});

describe('commandFlee — atteindre le bord (rules.md 5 et 2)', () => {
  test('l\'unité quitte le terrain une fois le bord atteint, PV conservés', () => {
    const grid = new Grid(10, 10);
    const state = createCommandState();
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 5); // à 1 case du bord gauche
    unit.hp = 17; // PV déjà réduits, doivent être conservés tels quels

    expect(commandFlee(state, 0, unit)).toBe(true);
    resolveCombatTick([unit], grid, 1);

    expect(unit.hasFled).toBe(true);
    expect(unit.isOnField).toBe(false);
    expect(unit.hp).toBe(17);
  });

  test('depuis un état engagé : désengagement immédiat mais l\'adversaire porte une dernière attaque', () => {
    const grid = new Grid(10, 10);
    const state = createCommandState();
    const a = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 5);
    const b = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 6, 5); // adjacente à a

    // Tick d'échauffement (delta trop court pour déclencher une attaque normale) : les deux
    // s'engagent mutuellement au corps-à-corps sans encore échanger de dégâts.
    resolveCombatTick([a, b], grid, 0.1);
    expect(a.status).toBe('engaged');
    expect(b.status).toBe('engaged');

    expect(commandFlee(state, 0.1, a)).toBe(true);

    // Delta volontairement minuscule : si la dernière attaque n'était pas garantie,
    // le timer d'attaque normal de b (0.1 + 0.1 = 0.2s) ne suffirait pas à déclencher un coup.
    resolveCombatTick([a, b], grid, 0.1);

    expect(a.status).toBe('fleeing');
    expect(a.hp).toBe(a.species.maxHp - b.species.damage); // dernière attaque de b encaissée
    expect(b.hp).toBe(b.species.maxHp); // a ne riposte pas, elle fuit
  });
});

describe('cooldown des commandes (rules.md 5.1)', () => {
  test('bloque toute nouvelle commande avant 5 secondes, peu importe l\'unité ciblée', () => {
    const state = createCommandState();
    const unitA = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const unitB = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 1);
    const target = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 5, 5);

    expect(commandAttack(state, 0, unitA, target)).toBe(true);
    expect(commandMoveTo(state, 2, unitB, 3, 3)).toBe(false); // 2s < 5s, autre unité pourtant
    expect(unitB.command).toBeNull();

    expect(commandMoveTo(state, COMMAND_COOLDOWN_SECONDS, unitB, 3, 3)).toBe(true);
  });
});
