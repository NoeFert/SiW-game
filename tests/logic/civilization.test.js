import {
  createUnit, createStartingUnits, countUnitsBySpecies, keepSurvivors, createArmy, armyUnits,
  summonAction, ARMY_PP_CAP, armyCost, canAddToArmy, addToArmy, canRemoveFromArmy,
  removeFromArmy, renameArmy,
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

describe('armée — coût, ajout et retrait (rules.md 11.2)', () => {
  const roster = WYRMS_ROSTER;
  const lambtons = (n) => Array.from({ length: n }, () => createUnit('lambtonWorm'));

  test('le coût est la somme des coûts en PP des individus de l\'armée', () => {
    const units = [...lambtons(2), createUnit('fafnir'), createUnit('amphiptere')];
    expect(armyCost(createArmy('A', units.slice(0, 3)), units, roster)).toBe(130);
  });

  test('ajouter un individu d\'une espèce prend un individu possédé hors de l\'armée', () => {
    const units = lambtons(3);
    const army = addToArmy(createArmy('A', [units[0]]), units, roster, 'lambtonWorm');
    expect(army.unitIds).toHaveLength(2);
    expect(new Set(army.unitIds).size).toBe(2);
    expect(armyCost(army, units, roster)).toBe(20);
  });

  test('ajout impossible s\'il ne reste aucun individu de l\'espèce hors de l\'armée', () => {
    const units = lambtons(2);
    const army = createArmy('A', units);
    expect(canAddToArmy(army, units, roster, 'lambtonWorm')).toBe(false);
    expect(canAddToArmy(army, units, roster, 'fafnir')).toBe(false);
    expect(addToArmy(army, units, roster, 'lambtonWorm')).toBe(army);
  });

  test('ajout possible jusqu\'à 500 PP pile, impossible au-delà', () => {
    const units = lambtons(51);
    const army = createArmy('A', units.slice(0, 49)); // 490 PP
    const at500 = addToArmy(army, units, roster, 'lambtonWorm');
    expect(armyCost(at500, units, roster)).toBe(ARMY_PP_CAP);
    expect(canAddToArmy(at500, units, roster, 'lambtonWorm')).toBe(false);
  });

  test('retirer un individu d\'une espèce présente dans l\'armée', () => {
    const units = [...lambtons(2), createUnit('fafnir')];
    const army = removeFromArmy(createArmy('A', units), units, 'fafnir');
    expect(countUnitsBySpecies(roster, armyUnits(army, units))).toEqual({ lambtonWorm: 2, amphiptere: 0, fafnir: 0 });
  });

  test('retrait impossible d\'une espèce absente de l\'armée', () => {
    const units = lambtons(2);
    expect(canRemoveFromArmy(createArmy('A', units), units, 'fafnir')).toBe(false);
  });

  test('retrait impossible du dernier individu de l\'armée (minimum 1)', () => {
    const units = lambtons(2);
    const army = createArmy('A', [units[0]]);
    expect(canRemoveFromArmy(army, units, 'lambtonWorm')).toBe(false);
    expect(removeFromArmy(army, units, 'lambtonWorm')).toBe(army);
  });
});

describe('renameArmy — renommage (rules.md 11.2)', () => {
  const army = createArmy('Armée 1', []);

  test('nom accepté, sans filtre (accents, chiffres, emojis)', () => {
    expect(renameArmy(army, 'Légion 42 🐉').name).toBe('Légion 42 🐉');
  });

  test('20 caractères acceptés, 21 refusés (un emoji compte pour un caractère)', () => {
    expect(renameArmy(army, 'a'.repeat(20)).name).toBe('a'.repeat(20));
    expect(renameArmy(army, 'a'.repeat(21))).toBe(army);
    expect(renameArmy(army, '🐉'.repeat(20)).name).toBe('🐉'.repeat(20));
  });

  test('nom vide ou fait d\'espaces refusé : l\'ancien nom est conservé', () => {
    expect(renameArmy(army, '')).toBe(army);
    expect(renameArmy(army, '   ')).toBe(army);
  });

  test('les espaces de début et de fin sont retirés', () => {
    expect(renameArmy(army, '  Horde  ').name).toBe('Horde');
  });
});
