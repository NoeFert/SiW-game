// Vérifie que les données transcrites correspondent exactement à units.md,
// pour détecter toute erreur de transcription des stats.
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';

describe('WYRMS_ROSTER (units.md)', () => {
  test('Lambton Worm', () => {
    expect(WYRMS_ROSTER.lambtonWorm).toMatchObject({
      size: 1,
      cost: 10,
      maxHp: 40,
      damage: 8,
      moveSpeed: 2.5,
      attackSpeed: 1.0,
      range: null,
      copies: 12,
    });
  });

  test('Amphiptère', () => {
    expect(WYRMS_ROSTER.amphiptere).toMatchObject({
      size: 1,
      cost: 25,
      maxHp: 18,
      damage: 10,
      moveSpeed: 4,
      attackSpeed: 1.3,
      range: 4,
      copies: 8,
    });
    expect(WYRMS_ROSTER.amphiptere.keywords).toContain('flying');
  });

  test('Fafnir the Cursed One', () => {
    expect(WYRMS_ROSTER.fafnir).toMatchObject({
      size: 2,
      cost: 110,
      maxHp: 220,
      damage: { ranged: 30, melee: 45 },
      moveSpeed: 1.5,
      attackSpeed: 1.8,
      range: 3,
      copies: 1,
    });
    expect(WYRMS_ROSTER.fafnir.keywords).toEqual(expect.arrayContaining(['legendary', 'flying']));
    expect(WYRMS_ROSTER.fafnir.abilities).toEqual([
      { trigger: 'periodic', every: 5, type: 'bonusDamage', multiplier: 2, name: 'Attaque dévastatrice' },
    ]);
  });
});
