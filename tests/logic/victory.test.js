import { resolveVictory } from '../../src/logic/victory.js';
import { createArmy } from '../../src/logic/army.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';

// Unité de bataille minimale (voir src/logic/unit.js).
const deployed = (individualId, { alive = true, killXp = 0, level = 1 } = {}) => ({
  individualId, faction: 'player', level, killXp, isAlive: alive,
});

const units = [
  { id: 'w1', species: 'lambtonWorm', xp: 40 },
  { id: 'w2', species: 'lambtonWorm', xp: 0 },
  { id: 'w3', species: 'lambtonWorm', xp: 0 },
  { id: 'f', species: 'fafnir', xp: 350 }, // niveau 4
];

describe('resolveVictory — bataille 01 (rules.md 11)', () => {
  const save = {
    units, army: null, playerXp: 0, spiritStones: 0, fallenLegendaryLevel: null,
  };
  const battleUnits = [deployed('w1', { killXp: 6 }), deployed('w2', { alive: false }), deployed('f', { alive: false, level: 4 })];
  const { save: after, report } = resolveVictory(save, battleUnits, WYRMS_ROSTER, { firstBattle: true, armyName: 'Armée 1' });

  test('morts retirés ; XP : +10 de survie + coût des ennemis achevés, jamais-déployés inchangés', () => {
    expect(after.units).toEqual([
      { id: 'w1', species: 'lambtonWorm', xp: 56 },
      { id: 'w3', species: 'lambtonWorm', xp: 0 },
    ]);
  });

  test('joueur : 100 XP fixes', () => {
    expect(report.xpGained).toBe(100);
    expect(after.playerXp).toBe(100);
  });

  test('armée de départ : tous les survivants', () => {
    expect(after.army).toEqual({ name: 'Armée 1', unitIds: ['w1', 'w3'] });
  });

  test('niveau du Légendaire à sa mort mémorisé', () => {
    expect(after.fallenLegendaryLevel).toBe(4);
  });

  test('bilan : individus qui ont monté de niveau', () => {
    expect(report.levelUps).toEqual([{ species: 'lambtonWorm', from: 1, to: 2, count: 1 }]);
  });
});

describe('resolveVictory — batailles suivantes (rules.md 11.5)', () => {
  test('XP : 100 + 100 × PP survivants / PP de l\'armée ; morts retirés de l\'armée', () => {
    const army = createArmy('A', units); // 10 + 10 + 10 + 110 = 140 PP
    const save = {
      units, army, playerXp: 0, spiritStones: 0, fallenLegendaryLevel: null,
    };
    const { save: after, report } = resolveVictory(save, [deployed('w1', { alive: false })], WYRMS_ROSTER, { firstBattle: false });
    expect(report.xpGained).toBe(100 + Math.floor((100 * 130) / 140));
    expect(after.army.unitIds).toEqual(['w2', 'w3', 'f']);
  });

  test('récompense de niveau du joueur en Spirit Stones ; mémoire du Légendaire inchangée s\'il survit', () => {
    const save = {
      units, army: createArmy('A', units), playerXp: 450, spiritStones: 5, fallenLegendaryLevel: 2,
    };
    const { save: after } = resolveVictory(save, [deployed('f', { level: 4 })], WYRMS_ROSTER, { firstBattle: false });
    expect(after.playerXp).toBe(650); // niveau 2 atteint
    expect(after.spiritStones).toBe(5 + 100);
    expect(after.fallenLegendaryLevel).toBe(2);
  });
});

describe('resolveVictory — récompense en Spirit Stones (rules.md 11.7)', () => {
  test('la récompense s\'ajoute au solde, avec la récompense de niveau', () => {
    const save = {
      units, army: createArmy('A', units), playerXp: 450, spiritStones: 5, fallenLegendaryLevel: null,
    };
    const { save: after, report } = resolveVictory(save, [], WYRMS_ROSTER, { firstBattle: false, reward: 60 });
    expect(report.spiritStonesGained).toBe(60);
    expect(after.spiritStones).toBe(5 + 60 + 100);
  });
});
