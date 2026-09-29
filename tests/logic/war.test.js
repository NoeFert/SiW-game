import {
  warBattleState, isWarCompleted, victoryReward, lossReport, resolveWarDefeat, safetyNetSpiritStones,
} from '../../src/logic/war.js';
import { createArmy } from '../../src/logic/army.js';
import { BATTLES, WAR_BATTLE_IDS } from '../../src/data/battles.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';

const IDS = ['war1', 'war2', 'war3'];

describe('batailles de « Partir en guerre » (rules.md 11.7)', () => {
  test('trois batailles de deux zones, victoire à la fin du script de la dernière zone, sans tutoriel', () => {
    expect(WAR_BATTLE_IDS).toEqual(IDS);
    expect(IDS.map((id) => BATTLES[id].zones)).toEqual([['field', 'wall'], ['wall', 'lanes'], ['lanes', 'fort']]);
    for (const id of IDS) {
      expect(BATTLES[id].phases).toHaveLength(2);
      expect(BATTLES[id]).toMatchObject({ victoryWhenScriptCleared: true, tutorial: null });
      expect(BATTLES[id].orders).toBeUndefined(); // les trois ordres
      expect(BATTLES[id].surrenderAllowed).toBeUndefined(); // abandon possible
    }
  });

  test('récompenses provisoires : 50 pour la bataille 01, 60 / 80 / 100 ensuite', () => {
    expect(BATTLES.firstBattle.reward).toBe(50);
    expect(IDS.map((id) => BATTLES[id].reward)).toEqual([60, 80, 100]);
  });
});

describe('déblocage en séquence (rules.md 11.7)', () => {
  test('au départ, seule la bataille 1 est disponible', () => {
    expect(IDS.map((id) => warBattleState(IDS, [], id))).toEqual(['available', 'locked', 'locked']);
  });

  test('gagner une bataille débloque la suivante ; une bataille gagnée reste marquée « gagnée »', () => {
    expect(IDS.map((id) => warBattleState(IDS, ['war1'], id))).toEqual(['won', 'available', 'locked']);
  });

  test('contenu terminé une fois les trois gagnées', () => {
    expect(isWarCompleted(IDS, ['war1', 'war2'])).toBe(false);
    expect(isWarCompleted(IDS, ['war1', 'war2', 'war3'])).toBe(true);
  });
});

describe('récompense de victoire (rules.md 11.7)', () => {
  test('pleine la première fois, 25 % au rejeu, arrondi inférieur', () => {
    expect(victoryReward(60, false)).toBe(60);
    expect([60, 80, 100].map((r) => victoryReward(r, true))).toEqual([15, 20, 25]);
    expect(victoryReward(50, true)).toBe(12);
  });
});

// Unité de bataille minimale (voir src/logic/unit.js).
const deployed = (individualId, { alive = true, level = 1 } = {}) => ({
  individualId, faction: 'player', level, killXp: 0, isAlive: alive,
});

describe('défaite dans « Partir en guerre » (rules.md 11.7)', () => {
  const units = [
    { id: 'w1', species: 'lambtonWorm', xp: 40 },
    { id: 'w2', species: 'lambtonWorm', xp: 0 },
    { id: 'f', species: 'fafnir', xp: 350 },
  ];
  const save = { units, army: createArmy('A', units), fallenLegendaryLevel: null };
  const { save: after, lost } = resolveWarDefeat(
    save, [deployed('w1', { alive: false }), deployed('w2'), deployed('f', { alive: false, level: 4 })], WYRMS_ROSTER,
  );

  test('les tués sont perdus quand même, retirés de la liste et de l\'armée', () => {
    expect(after.units).toEqual([{ id: 'w2', species: 'lambtonWorm', xp: 0 }]);
    expect(after.army.unitIds).toEqual(['w2']);
  });

  test('aucune XP pour les survivants', () => {
    expect(after.units[0].xp).toBe(0);
  });

  test('niveau du Légendaire mort mémorisé', () => {
    expect(after.fallenLegendaryLevel).toBe(4);
  });

  test('bilan des pertes par espèce', () => {
    expect(lost).toEqual([{ species: WYRMS_ROSTER.lambtonWorm, lost: 1 }, { species: WYRMS_ROSTER.fafnir, lost: 1 }]);
  });

  test('armée entièrement tuée : armée vide', () => {
    const { save: wiped } = resolveWarDefeat(save, units.map((u) => deployed(u.id, { alive: false })), WYRMS_ROSTER);
    expect(wiped.army.unitIds).toEqual([]);
  });
});

describe('filet de sécurité (rules.md 11.7)', () => {
  test('aucun individu et solde insuffisant : solde porté au prix de l\'unité basique', () => {
    expect(safetyNetSpiritStones(WYRMS_ROSTER, [], 3)).toBe(10);
    expect(safetyNetSpiritStones(UNDEAD_ROSTER, [], 0)).toBe(6);
  });

  test('sans effet si le joueur a encore un individu ou assez de Spirit Stones', () => {
    expect(safetyNetSpiritStones(WYRMS_ROSTER, [{ id: 'a', species: 'fafnir', xp: 0 }], 0)).toBe(0);
    expect(safetyNetSpiritStones(WYRMS_ROSTER, [], 42)).toBe(42);
  });
});
