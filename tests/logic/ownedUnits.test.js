import {
  createUnit, createStartingUnits, countUnitsBySpecies,
} from '../../src/logic/ownedUnits.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';

describe('createUnit — individu (rules.md 11.1)', () => {
  test('un individu a un identifiant, une espèce et une XP (niveau 1, 0 XP par défaut)', () => {
    const unit = createUnit('lambtonWorm');
    expect(Object.keys(unit).sort()).toEqual(['id', 'species', 'xp']);
    expect(unit.species).toBe('lambtonWorm');
    expect(unit.xp).toBe(0);
  });

  test('chaque individu a un identifiant unique', () => {
    expect(createUnit('lambtonWorm').id).not.toBe(createUnit('lambtonWorm').id);
  });
});

describe('createStartingUnits — dotation de départ (rules.md 11.1)', () => {
  test('Wyrms : 12 Vers de Lambton, 8 Amphiptères, 1 Fafnir', () => {
    const units = createStartingUnits(WYRMS_ROSTER);
    expect(countUnitsBySpecies(WYRMS_ROSTER, units)).toEqual({ lambtonWorm: 12, amphiptere: 8, fafnir: 1 });
  });

  test('Morts-Vivants : autant d\'individus que les copies de départ', () => {
    const units = createStartingUnits(UNDEAD_ROSTER);
    const expected = Object.fromEntries(Object.entries(UNDEAD_ROSTER).map(([k, s]) => [k, s.copies]));
    expect(countUnitsBySpecies(UNDEAD_ROSTER, units)).toEqual(expected);
  });

  test('tous les identifiants sont distincts', () => {
    const units = createStartingUnits(WYRMS_ROSTER);
    expect(new Set(units.map((u) => u.id)).size).toBe(units.length);
  });
});

describe('countUnitsBySpecies', () => {
  test('une espèce sans individu compte 0', () => {
    expect(countUnitsBySpecies(WYRMS_ROSTER, [createUnit('amphiptere')]))
      .toEqual({ lambtonWorm: 0, amphiptere: 1, fafnir: 0 });
  });
});
