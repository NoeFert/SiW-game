// Vérifie que les données transcrites correspondent exactement à units.md.
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';

describe('UNDEAD_ROSTER (units.md)', () => {
  test('New-reborn Skeleton', () => {
    expect(UNDEAD_ROSTER.newRebornSkeleton).toMatchObject({
      size: 1,
      cost: 6,
      maxHp: 22,
      damage: 5,
      moveSpeed: 1.25,
      attackSpeed: 1.0,
      range: null,
      copies: 18,
    });
  });

  test('Necromant Initiate', () => {
    expect(UNDEAD_ROSTER.necromantInitiate).toMatchObject({
      size: 1,
      cost: 25,
      maxHp: 18,
      damage: 10,
      moveSpeed: 2,
      attackSpeed: 1.3,
      range: 4,
      copies: 8,
    });
    expect(UNDEAD_ROSTER.necromantInitiate.keywords).toContain('flying');
  });

  test('Athos the Lord of Pain', () => {
    expect(UNDEAD_ROSTER.athos).toMatchObject({
      size: 2,
      cost: 110,
      maxHp: 145,
      damage: 50,
      moveSpeed: 0.6,
      attackSpeed: 2.0,
      range: 5,
      copies: 1,
    });
    expect(UNDEAD_ROSTER.athos.keywords).toEqual(expect.arrayContaining(['legendary', 'flying']));
    expect(UNDEAD_ROSTER.athos.abilities).toEqual([
      { trigger: 'periodic', every: 4, type: 'paralyze', name: 'Frappe paralysante' },
      { trigger: 'onKill', type: 'heal', amount: 40, name: 'Soif de sang' },
    ]);
  });
});
