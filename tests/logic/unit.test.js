import Unit from '../../src/logic/unit.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';

describe('Unit', () => {
  test('spawns with full HP from its species and the given position/faction', () => {
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 3, 5);
    expect(unit.hp).toBe(WYRMS_ROSTER.lambtonWorm.maxHp);
    expect(unit.x).toBe(3);
    expect(unit.y).toBe(5);
    expect(unit.faction).toBe('player');
    expect(unit.status).toBe('idle');
  });

  test('each unit gets a unique id', () => {
    const a = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const b = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    expect(a.id).not.toBe(b.id);
  });

  describe('isAlive / takeDamage', () => {
    test('alive on spawn', () => {
      const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
      expect(unit.isAlive).toBe(true);
    });

    test('takeDamage reduces HP', () => {
      const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
      unit.takeDamage(15);
      expect(unit.hp).toBe(25);
      expect(unit.isAlive).toBe(true);
    });

    test('HP never drops below 0', () => {
      const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
      unit.takeDamage(9999);
      expect(unit.hp).toBe(0);
    });

    test('dies when HP reaches 0 (rules.md 4.4)', () => {
      const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
      unit.takeDamage(unit.species.maxHp);
      expect(unit.isAlive).toBe(false);
    });
  });

  describe('species-derived flags', () => {
    test('isFlying reflects the [Vol] keyword', () => {
      expect(new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0).isFlying).toBe(false);
      expect(new Unit(WYRMS_ROSTER.amphiptere, 'player', 0, 0).isFlying).toBe(true);
      expect(new Unit(WYRMS_ROSTER.fafnir, 'player', 0, 0).isFlying).toBe(true);
    });

    test('isLegendary reflects the [Légendaire] keyword', () => {
      expect(new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0).isLegendary).toBe(false);
      expect(new Unit(WYRMS_ROSTER.fafnir, 'player', 0, 0).isLegendary).toBe(true);
    });

    test('size reflects the 2x2 footprint of a 4-cell unit (rules.md 3)', () => {
      expect(new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0).size).toBe(1);
      expect(new Unit(WYRMS_ROSTER.fafnir, 'player', 0, 0).size).toBe(2);
    });
  });
});
