import { createUnit, countUnitsBySpecies } from '../../src/logic/ownedUnits.js';
import {
  createArmy, armyUnits, ARMY_PP_CAP, armyCost, canAddToArmy, addToArmy, canRemoveFromArmy,
  removeFromArmy, renameArmy, removeDeadFromArmy,
} from '../../src/logic/army.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';

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

describe('armée — coût, ajout et retrait individu par individu (rules.md 11.2)', () => {
  const roster = WYRMS_ROSTER;
  const lambtons = (n) => Array.from({ length: n }, () => createUnit('lambtonWorm'));

  test('le coût est la somme des coûts en PP des individus de l\'armée', () => {
    const units = [...lambtons(2), createUnit('fafnir'), createUnit('amphiptere')];
    expect(armyCost(createArmy('A', units.slice(0, 3)), units, roster)).toBe(130);
  });

  test('le coût ne dépend pas du niveau (rules.md 11.6)', () => {
    const units = [createUnit('lambtonWorm', 500)];
    expect(armyCost(createArmy('A', units), units, roster)).toBe(10);
  });

  test('ajouter l\'individu coché, précisément', () => {
    const units = lambtons(3);
    const army = addToArmy(createArmy('A', [units[0]]), units, roster, units[2].id);
    expect(army.unitIds).toEqual([units[0].id, units[2].id]);
  });

  test('ajout impossible d\'un individu déjà dans l\'armée ou non possédé', () => {
    const units = lambtons(2);
    const army = createArmy('A', units);
    expect(canAddToArmy(army, units, roster, units[0].id)).toBe(false);
    expect(canAddToArmy(army, units, roster, 'inconnu')).toBe(false);
    expect(addToArmy(army, units, roster, units[0].id)).toBe(army);
  });

  test('ajout possible jusqu\'à 500 PP pile, impossible au-delà', () => {
    const units = lambtons(51);
    const army = createArmy('A', units.slice(0, 49)); // 490 PP
    const at500 = addToArmy(army, units, roster, units[49].id);
    expect(armyCost(at500, units, roster)).toBe(ARMY_PP_CAP);
    expect(canAddToArmy(at500, units, roster, units[50].id)).toBe(false);
  });

  test('retirer l\'individu décoché, précisément', () => {
    const units = [...lambtons(2), createUnit('fafnir')];
    const army = removeFromArmy(createArmy('A', units), units, units[1].id);
    expect(army.unitIds).toEqual([units[0].id, units[2].id]);
    expect(countUnitsBySpecies(roster, armyUnits(army, units))).toEqual({ lambtonWorm: 1, amphiptere: 0, fafnir: 1 });
  });

  test('retrait impossible d\'un individu absent de l\'armée', () => {
    const units = lambtons(2);
    expect(canRemoveFromArmy(createArmy('A', [units[0]]), units, units[1].id)).toBe(false);
  });

  test('retrait impossible du dernier individu de l\'armée (minimum 1)', () => {
    const units = lambtons(2);
    const army = createArmy('A', [units[0]]);
    expect(canRemoveFromArmy(army, units, units[0].id)).toBe(false);
    expect(removeFromArmy(army, units, units[0].id)).toBe(army);
  });

  test('un individu mort est retiré de l\'armée', () => {
    const units = lambtons(3);
    const army = createArmy('A', units);
    expect(removeDeadFromArmy(army, [units[0], units[2]]).unitIds).toEqual([units[0].id, units[2].id]);
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
