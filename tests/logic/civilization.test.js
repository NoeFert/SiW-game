import {
  createUnit, createStartingUnits, countUnitsBySpecies, keepSurvivors, createArmy, armyUnits,
  summonAction,
} from '../../src/logic/civilization.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';

describe('createUnit — individu (rules.md 11.1)', () => {
  test('un individu n\'a qu\'un identifiant et une espèce', () => {
    const unit = createUnit('lambtonWorm');
    expect(Object.keys(unit).sort()).toEqual(['id', 'species']);
    expect(unit.species).toBe('lambtonWorm');
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

describe('keepSurvivors — pertes à la victoire (rules.md 11.1)', () => {
  test('retire les individus tués, espèce par espèce', () => {
    const units = createStartingUnits(WYRMS_ROSTER);
    const survivors = keepSurvivors(units, { lambtonWorm: 9, amphiptere: 7, fafnir: 1 });
    expect(countUnitsBySpecies(WYRMS_ROSTER, survivors)).toEqual({ lambtonWorm: 9, amphiptere: 7, fafnir: 1 });
    survivors.forEach((u) => expect(units).toContain(u));
  });

  test('une espèce entièrement tuée disparaît de la liste', () => {
    const units = createStartingUnits(WYRMS_ROSTER);
    const survivors = keepSurvivors(units, { lambtonWorm: 12, amphiptere: 8, fafnir: 0 });
    expect(survivors.some((u) => u.species === 'fafnir')).toBe(false);
  });
});

describe('createArmy — armée (rules.md 11.2)', () => {
  test('nom + identifiants des individus', () => {
    const units = [createUnit('lambtonWorm'), createUnit('fafnir')];
    expect(createArmy('Armée 1', units)).toEqual({ name: 'Armée 1', unitIds: [units[0].id, units[1].id] });
  });
});

describe('armyUnits — individus de l\'armée (rules.md 11.2)', () => {
  test('ne garde que les individus dont l\'identifiant est dans l\'armée', () => {
    const units = [createUnit('lambtonWorm'), createUnit('lambtonWorm'), createUnit('fafnir')];
    const army = createArmy('Armée 1', [units[0], units[2]]);
    expect(armyUnits(army, units)).toEqual([units[0], units[2]]);
  });

  test('sans armée (avant la victoire de la bataille 01), aucun individu', () => {
    expect(armyUnits(null, [createUnit('lambtonWorm')])).toEqual([]);
  });
});

describe('summonAction — Invoquer / Réinvoquer (rules.md 11.4)', () => {
  test('espèce non légendaire : toujours « Invoquer », sans plafond de possession', () => {
    expect(summonAction(WYRMS_ROSTER.lambtonWorm, 0)).toBe('summon');
    expect(summonAction(WYRMS_ROSTER.lambtonWorm, 50)).toBe('summon');
  });

  test('[Légendaire] vivant : « Déjà à vos côtés »', () => {
    expect(summonAction(WYRMS_ROSTER.fafnir, 1)).toBe('alreadyOwned');
  });

  test('[Légendaire] mort : « Réinvoquer »', () => {
    expect(summonAction(UNDEAD_ROSTER.athos, 0)).toBe('resummon');
  });
});
