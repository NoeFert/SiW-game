import Grid from '../../src/logic/grid.js';
import Unit from '../../src/logic/unit.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';
import { resolveCombatTick, chooseTarget, isAdjacent, isInRange } from '../../src/logic/combat.js';

// Cible neutre pour mesurer précisément les dégâts (PV élevés, ne bouge jamais, n'attaque
// jamais dans la fenêtre d'un test) — évite que le clamp à 0 de takeDamage masque un montant exact.
const DUMMY = {
  keywords: [],
  attackType: 'melee',
  size: 1,
  maxHp: 1000,
  damage: 1,
  moveSpeed: 0,
  attackSpeed: 999,
  range: null,
};

describe('isAdjacent / isInRange (rules.md 4.3 et 4.5)', () => {
  test('adjacent units are never "in range" for a ranged attack', () => {
    const shooter = new Unit(WYRMS_ROSTER.amphiptere, 'player', 5, 5);
    const target = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 6, 5);

    expect(isAdjacent(shooter, target)).toBe(true);
    expect(isInRange(shooter, target)).toBe(false);
  });

  test('a 2x2 unit is adjacent as soon as one of its 4 cells touches the target', () => {
    const fafnir = new Unit(WYRMS_ROSTER.fafnir, 'player', 0, 0); // occupies (0,0)-(1,1)
    const target = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 2, 1); // touches (1,1)

    expect(isAdjacent(fafnir, target)).toBe(true);
  });
});

describe('resolveCombatTick — dégâts simultanés (rules.md 4.1)', () => {
  test('two units trading lethal blows on the same tick both die', () => {
    const grid = new Grid(10, 10);
    const a = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const b = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 1, 0);
    a.hp = 5;
    b.hp = 5;

    resolveCombatTick([a, b], grid, a.species.attackSpeed);

    expect(a.isAlive).toBe(false);
    expect(b.isAlive).toBe(false);
  });
});

describe('chooseTarget — redirection d\'engagement (rules.md 4.2)', () => {
  test('redirects to the next enemy when the nearest one has no free adjacent cell', () => {
    const grid = new Grid(20, 20);
    const mover = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 10);
    const surroundedEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 7, 10);
    const blockers = [
      [6, 9], [7, 9], [8, 9],
      [6, 10], [8, 10],
      [6, 11], [7, 11], [8, 11],
    ].map(([x, y]) => new Unit(WYRMS_ROSTER.lambtonWorm, 'player', x, y));
    const farEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 15, 10);

    const target = chooseTarget(mover, [mover, surroundedEnemy, farEnemy, ...blockers], grid);

    expect(target).toBe(farEnemy);
  });

  test('waits on the only enemy left when no other target exists', () => {
    const grid = new Grid(20, 20);
    const mover = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 10);
    const surroundedEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 7, 10);
    const blockers = [
      [6, 9], [7, 9], [8, 9],
      [6, 10], [8, 10],
      [6, 11], [7, 11], [8, 11],
    ].map(([x, y]) => new Unit(WYRMS_ROSTER.lambtonWorm, 'player', x, y));

    const target = chooseTarget(mover, [mover, surroundedEnemy, ...blockers], grid);

    expect(target).toBe(surroundedEnemy);
  });
});

describe('chooseTarget — distance entre cases les plus proches (rules.md 3)', () => {
  test('a 2x2 enemy counts from its closest cell, not its top-left cell', () => {
    const grid = new Grid(12, 12);
    const shooter = new Unit(WYRMS_ROSTER.amphiptere, 'player', 5, 5);
    const smallEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 8, 5); // 3 cases
    const bigEnemy = new Unit(WYRMS_ROSTER.fafnir, 'enemy', 2, 2); // (3,3) à 2 cases, coin haut-gauche à 3

    expect(chooseTarget(shooter, [shooter, smallEnemy, bigEnemy], grid)).toBe(bigEnemy);
  });

  test('a 2x2 unit measures from its own closest cell, not its top-left cell', () => {
    const grid = new Grid(12, 12);
    const fafnir = new Unit(WYRMS_ROSTER.fafnir, 'player', 5, 5); // occupies (5,5)-(6,6)
    const leftEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 1, 5); // 4 cases
    const rightEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 9, 5); // (6,5) à 3 cases, coin haut-gauche à 4

    expect(chooseTarget(fafnir, [fafnir, leftEnemy, rightEnemy], grid)).toBe(rightEnemy);
  });
});

describe('resolveCombatTick — attaque à distance (rules.md 4.5)', () => {
  test('a ranged unit never fires on an adjacent target and steps back instead', () => {
    const grid = new Grid(10, 10);
    const shooter = new Unit(WYRMS_ROSTER.amphiptere, 'player', 5, 5);
    const target = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 6, 5);

    resolveCombatTick([shooter, target], grid, shooter.species.attackSpeed);

    expect(target.hp).toBe(target.species.maxHp);
    expect(shooter.status).toBe('moving');
  });

  test('Fafnir fires at range then switches to melee once adjacent (hybrid, 4.5)', () => {
    const grid = new Grid(10, 10);

    const fafnirRanged = new Unit(WYRMS_ROSTER.fafnir, 'player', 0, 0); // occupies (0,0)-(1,1)
    const farDummy = new Unit(DUMMY, 'enemy', 3, 0); // distance 2 from (1,0) : à portée, pas adjacent
    resolveCombatTick([fafnirRanged, farDummy], grid, fafnirRanged.species.attackSpeed);
    expect(farDummy.hp).toBe(DUMMY.maxHp - 30); // dégâts à distance

    const fafnirMelee = new Unit(WYRMS_ROSTER.fafnir, 'player', 0, 0);
    const adjacentDummy = new Unit(DUMMY, 'enemy', 2, 0); // adjacent à (1,0)
    resolveCombatTick([fafnirMelee, adjacentDummy], grid, fafnirMelee.species.attackSpeed);
    expect(adjacentDummy.hp).toBe(DUMMY.maxHp - 45); // dégâts corps-à-corps
  });

  test('un tir à distance émet un évènement rangedAttack, pas une attaque au corps-à-corps', () => {
    const grid = new Grid(10, 10);
    const shooter = new Unit(WYRMS_ROSTER.amphiptere, 'player', 0, 0);
    const farDummy = new Unit(DUMMY, 'enemy', 3, 0);
    const events = resolveCombatTick([shooter, farDummy], grid, shooter.species.attackSpeed);
    expect(events).toContainEqual({ type: 'rangedAttack', unit: shooter, target: farDummy });

    const fafnirMelee = new Unit(WYRMS_ROSTER.fafnir, 'player', 0, 0);
    const adjacentDummy = new Unit(DUMMY, 'enemy', 2, 0);
    const meleeEvents = resolveCombatTick([fafnirMelee, adjacentDummy], grid, fafnirMelee.species.attackSpeed);
    expect(meleeEvents.some((e) => e.type === 'rangedAttack')).toBe(false);
  });
});

describe('aptitudes automatiques (rules.md 6, units.md)', () => {
  test('Fafnir — Attaque dévastatrice : la 5e attaque inflige +100% de dégâts', () => {
    const grid = new Grid(10, 10);
    const fafnir = new Unit(WYRMS_ROSTER.fafnir, 'player', 0, 0);
    fafnir.attacksLanded = 4; // la prochaine attaque sera la 5e
    const dummy = new Unit(DUMMY, 'enemy', 3, 0); // à portée, pas adjacent

    const events = resolveCombatTick([fafnir, dummy], grid, fafnir.species.attackSpeed);

    expect(dummy.hp).toBe(DUMMY.maxHp - 60); // 30 * 2
    expect(fafnir.attacksLanded).toBe(5);
    expect(events).toContainEqual({ type: 'bonusDamage', unit: fafnir, target: dummy, damage: 60 });
  });

  test('Athos — Frappe paralysante : la 4e attaque marque la cible', () => {
    const grid = new Grid(10, 10);
    const athos = new Unit(UNDEAD_ROSTER.athos, 'enemy', 0, 0);
    athos.attacksLanded = 3; // la prochaine attaque sera la 4e
    const dummy = new Unit(DUMMY, 'player', 4, 0); // distance 3 depuis (1,0), à portée (5)

    const events = resolveCombatTick([athos, dummy], grid, athos.species.attackSpeed);

    expect(dummy.hp).toBe(DUMMY.maxHp - 50);
    expect(dummy.paralyzedNextAttack).toBe(true);
    expect(events).toContainEqual({ type: 'paralyze', unit: dummy });
  });

  test('une attaque paralysée ne porte aucun dégât et ne compte pas comme portée', () => {
    const grid = new Grid(10, 10);
    const paralyzed = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    paralyzed.paralyzedNextAttack = true;
    const victim = new Unit(DUMMY, 'enemy', 1, 0); // adjacent

    const events = resolveCombatTick([paralyzed, victim], grid, paralyzed.species.attackSpeed);

    expect(victim.hp).toBe(DUMMY.maxHp);
    expect(paralyzed.paralyzedNextAttack).toBe(false);
    expect(paralyzed.attacksLanded).toBe(0);
    expect(events).toContainEqual({ type: 'missed', unit: paralyzed });
  });

  test('Athos — Soif de sang : régénère 40 PV sur un coup fatal, plafonné au max', () => {
    const grid = new Grid(10, 10);

    const athos = new Unit(UNDEAD_ROSTER.athos, 'enemy', 0, 0);
    athos.hp = 100;
    const weakTarget = new Unit(DUMMY, 'player', 4, 0);
    weakTarget.hp = 10; // meurt sous le coup d'Athos (50 dégâts)
    const events = resolveCombatTick([athos, weakTarget], grid, athos.species.attackSpeed);
    expect(weakTarget.isAlive).toBe(false);
    expect(athos.hp).toBe(140); // 100 + 40
    expect(events).toContainEqual({ type: 'heal', unit: athos, amount: 40 });

    const athosNearCap = new Unit(UNDEAD_ROSTER.athos, 'enemy', 0, 0);
    athosNearCap.hp = 130; // 130 + 40 = 170 > 145, doit être plafonné
    const weakTarget2 = new Unit(DUMMY, 'player', 4, 0);
    weakTarget2.hp = 1;
    resolveCombatTick([athosNearCap, weakTarget2], grid, athosNearCap.species.attackSpeed);
    expect(athosNearCap.hp).toBe(athosNearCap.species.maxHp);
  });
});

describe('mort (rules.md 4.4)', () => {
  test('une unité tuée est retirée du ciblage et ne compte plus comme ennemie', () => {
    const grid = new Grid(10, 10);
    const a = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const b = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 1, 0);
    b.hp = 1; // meurt au premier coup de a

    resolveCombatTick([a, b], grid, a.species.attackSpeed);

    expect(b.isAlive).toBe(false);
    expect(chooseTarget(a, [a, b], grid)).toBeNull();
  });
});

describe('recul d\'une unité à distance acculée (rules.md 4.5)', () => {
  test('coincée dans un coin, elle contourne pour sortir du contact puis tire', () => {
    const grid = new Grid(10, 10);
    const shooter = new Unit(WYRMS_ROSTER.amphiptere, 'player', 9, 9); // recul direct hors grille
    const dummy = new Unit(DUMMY, 'enemy', 8, 8);

    for (let i = 0; i < 20; i++) resolveCombatTick([shooter, dummy], grid, 0.1);
    expect(isAdjacent(shooter, dummy)).toBe(false);

    for (let i = 0; i < 20; i++) resolveCombatTick([shooter, dummy], grid, 0.1);
    expect(dummy.hp).toBeLessThan(DUMMY.maxHp);
  });
});

describe('résolution simultanée indépendante de l\'ordre (rules.md 4.1)', () => {
  test('une paralysie posée ce tick n\'annule pas l\'attaque de la cible au même tick', () => {
    const grid = new Grid(10, 10);
    const athos = new Unit(UNDEAD_ROSTER.athos, 'enemy', 0, 0); // traité en premier
    athos.attacksLanded = 3;
    athos.status = 'attacking';
    athos.attackTimer = athos.species.attackSpeed - 0.01;
    const worm = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 4, 0);
    worm.status = 'engaged';
    worm.attackTimer = worm.species.attackSpeed - 0.01;
    const dummy = new Unit(DUMMY, 'enemy', 5, 0);

    resolveCombatTick([athos, worm, dummy], grid, 0.02);

    expect(dummy.hp).toBe(DUMMY.maxHp - 8); // le coup du ver porte bien
    expect(worm.paralyzedNextAttack).toBe(true); // c'est son coup suivant qui sera raté
  });

  test('Soif de sang : Athos se soigne même si un allié frappe la même cible au même tick', () => {
    const grid = new Grid(10, 10);
    const worm = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 5, 0); // traité avant Athos
    worm.status = 'engaged';
    worm.attackTimer = worm.species.attackSpeed - 0.01;
    const athos = new Unit(UNDEAD_ROSTER.athos, 'enemy', 0, 0);
    athos.hp = 100;
    athos.status = 'attacking';
    athos.attackTimer = athos.species.attackSpeed - 0.01;
    const victim = new Unit(DUMMY, 'player', 4, 0);
    victim.hp = 5; // le ver seul suffirait à la tuer

    resolveCombatTick([worm, athos, victim], grid, 0.02);

    expect(victim.isAlive).toBe(false);
    expect(athos.hp).toBe(140);
  });

  test('une unité qui atteint le bord en fuyant subit le même sort quel que soit l\'ordre des unités', () => {
    const outcome = (enemyFirst) => {
      const grid = new Grid(10, 10);
      const fleeing = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 5); // à un pas du bord
      fleeing.hp = 5;
      fleeing.command = { type: 'flee' };
      fleeing.status = 'fleeing'; // dernière attaque au désengagement déjà portée
      fleeing.moveProgress = 0.99;
      const enemy = new Unit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 2, 5);
      enemy.status = 'engaged';
      enemy.target = fleeing;
      enemy.attackTimer = enemy.species.attackSpeed - 0.01; // frappe (5 dégâts) à ce tick

      resolveCombatTick(enemyFirst ? [enemy, fleeing] : [fleeing, enemy], grid, 0.02);
      return { alive: fleeing.isAlive, hp: fleeing.hp };
    };

    expect(outcome(false)).toEqual(outcome(true));
  });
});

describe('timer d\'attaque', () => {
  test('une unité qui arrive au contact ne frappe pas instantanément avec un timer hérité', () => {
    const grid = new Grid(10, 10);
    const worm = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    worm.status = 'moving';
    worm.attackTimer = 0.9; // reste d'un combat précédent
    const dummy = new Unit(DUMMY, 'enemy', 1, 0);

    resolveCombatTick([worm, dummy], grid, 0.2);

    expect(dummy.hp).toBe(DUMMY.maxHp);
  });
});

describe('Athos — tire en avançant (rules.md 4.5)', () => {
  test('tire tout en se rapprochant, puis s\'arrête à 2 cases sans jamais entrer au contact', () => {
    const grid = new Grid(20, 10);
    const athos = new Unit(UNDEAD_ROSTER.athos, 'enemy', 0, 0); // occupe (0,0)-(1,1)
    const dummy = new Unit(DUMMY, 'player', 6, 0); // à 5 cases : à portée dès le départ

    let everAdjacent = false;
    for (let i = 0; i < 100; i++) {
      resolveCombatTick([athos, dummy], grid, 0.1);
      if (isAdjacent(athos, dummy)) everAdjacent = true;
    }

    expect(dummy.hp).toBeLessThan(DUMMY.maxHp); // a tiré
    expect(athos.x).toBeGreaterThan(0); // a avancé en tirant
    expect(isInRange(athos, dummy)).toBe(true); // à distance de tir minimale (2 cases)
    expect(everAdjacent).toBe(false);
  });
});
