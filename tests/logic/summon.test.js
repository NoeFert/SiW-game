import { createUnit } from '../../src/logic/ownedUnits.js';
import { createArmy, armyUnits } from '../../src/logic/army.js';
import {
  summonAction, SUMMON_PRICE_FACTOR, LEGENDARY_PRICE_MULTIPLIER, summonPrice, canSummon, summon,
  resummonPrice,
} from '../../src/logic/summon.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';

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

describe('invocation (rules.md 11.4)', () => {
  const roster = WYRMS_ROSTER;

  test('prix = coût en PP × k (k = 1, pas de multiplicateur du Légendaire pour l\'instant)', () => {
    expect(SUMMON_PRICE_FACTOR).toBe(1);
    expect(LEGENDARY_PRICE_MULTIPLIER).toBe(1);
    expect(summonPrice(roster.lambtonWorm)).toBe(10);
    expect(summonPrice(roster.fafnir)).toBe(110);
  });

  test('invoquer débite le prix et ajoute un individu de l\'espèce', () => {
    const units = [createUnit('lambtonWorm')];
    const result = summon(roster, units, 100, 'amphiptere');
    expect(result.spiritStones).toBe(75);
    expect(result.units).toHaveLength(2);
    expect(result.units[1].species).toBe('amphiptere');
    expect(units.map((u) => u.id)).not.toContain(result.units[1].id);
  });

  test('solde exactement égal au prix : invocation possible, solde à 0', () => {
    expect(summon(roster, [], 10, 'lambtonWorm').spiritStones).toBe(0);
  });

  test('solde insuffisant : invocation impossible', () => {
    expect(canSummon(roster.amphiptere, 0, 24)).toBe(false);
    expect(summon(roster, [], 24, 'amphiptere')).toBeNull();
  });

  test('espèce non légendaire : pas de plafond de possession', () => {
    const units = Array.from({ length: 100 }, () => createUnit('lambtonWorm'));
    expect(summon(roster, units, 10, 'lambtonWorm').units).toHaveLength(101);
  });

  test('[Légendaire] vivant : invocation impossible, même avec un gros solde', () => {
    expect(summon(roster, [createUnit('fafnir')], 10000, 'fafnir')).toBeNull();
  });

  test('[Légendaire] mort : réinvocation possible, au même prix', () => {
    const result = summon(roster, [createUnit('lambtonWorm')], 10000, 'fafnir');
    expect(result.spiritStones).toBe(10000 - 110);
    expect(result.units.filter((u) => u.species === 'fafnir')).toHaveLength(1);
  });

  test('l\'individu invoqué n\'est pas ajouté à l\'armée', () => {
    const units = [createUnit('lambtonWorm')];
    const army = createArmy('A', units);
    const result = summon(roster, units, 100, 'lambtonWorm');
    expect(armyUnits(army, result.units)).toEqual(units);
  });
});

describe('réinvocation à niveau gardé (rules.md 11.4)', () => {
  const roster = WYRMS_ROSTER;

  test('+25 % du prix de base par niveau gardé au-delà du 1 (Fafnir : 110 / 165 / 220)', () => {
    expect(resummonPrice(roster.fafnir, 1)).toBe(110);
    expect(resummonPrice(roster.fafnir, 3)).toBe(165);
    expect(resummonPrice(roster.fafnir, 5)).toBe(220);
  });

  test('arrondi à l\'entier inférieur', () => {
    expect(resummonPrice({ ...roster.fafnir, cost: 11 }, 2)).toBe(13); // 13,75
  });

  test('le Légendaire revient au début du niveau choisi, au prix correspondant', () => {
    const result = summon(roster, [], 1000, 'fafnir', 3, 5);
    expect(result.units[0].xp).toBe(150);
    expect(result.spiritStones).toBe(1000 - 165);
  });

  test('niveau choisi au-delà du niveau à la mort : impossible', () => {
    expect(summon(roster, [], 1000, 'fafnir', 4, 3)).toBeNull();
  });

  test('solde insuffisant pour le niveau choisi : impossible', () => {
    expect(summon(roster, [], 164, 'fafnir', 3, 5)).toBeNull();
    expect(summon(roster, [], 164, 'fafnir', 1, 5).spiritStones).toBe(54);
  });

  test('une unité non légendaire est toujours invoquée niveau 1', () => {
    expect(summon(roster, [], 1000, 'lambtonWorm', 3, 5)).toBeNull();
    expect(summon(roster, [], 1000, 'lambtonWorm').units[0].xp).toBe(0);
  });
});
