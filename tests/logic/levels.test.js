import {
  INDIVIDUAL_MAX_LEVEL, INDIVIDUAL_MAX_XP, individualXpForLevel, individualLevel, individualProgress,
  levelStat, levelDamage, individualXpGains, applyVictoryToUnits, levelUps, sortByLevel,
  FIRST_BATTLE_PLAYER_XP, playerXpForLevel, playerLevel, playerProgress, victoryPlayerXp,
  playerLevelReward,
} from '../../src/logic/levels.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';

describe('courbe des individus (rules.md 11.6)', () => {
  test('50 × N XP pour passer du niveau N à N + 1 : seuils cumulés 0 / 50 / 150 / 300 / 500', () => {
    expect([1, 2, 3, 4, 5].map(individualXpForLevel)).toEqual([0, 50, 150, 300, 500]);
  });

  test('niveau selon l\'XP, aux seuils exacts', () => {
    expect(individualLevel(0)).toBe(1);
    expect(individualLevel(49)).toBe(1);
    expect(individualLevel(50)).toBe(2);
    expect(individualLevel(149)).toBe(2);
    expect(individualLevel(150)).toBe(3);
    expect(individualLevel(300)).toBe(4);
    expect(individualLevel(500)).toBe(5);
  });

  test('niveau 5 maximum, XP plafonnée à 500', () => {
    expect(INDIVIDUAL_MAX_LEVEL).toBe(5);
    expect(INDIVIDUAL_MAX_XP).toBe(500);
    expect(individualLevel(10000)).toBe(5);
  });

  test('barre d\'XP : progression dans le niveau, « MAX » au niveau 5', () => {
    expect(individualProgress(60)).toEqual({ level: 2, isMax: false, xpInLevel: 10, xpForLevel: 100 });
    expect(individualProgress(500)).toMatchObject({ level: 5, isMax: true });
  });
});

describe('stats par niveau (rules.md 11.6)', () => {
  test('+10 % par niveau au-dessus du 1, arrondi au plus proche : Ver de Lambton', () => {
    expect([1, 2, 3, 4, 5].map((l) => levelStat(8, l))).toEqual([8, 9, 10, 10, 11]);
    expect([1, 2, 3, 4, 5].map((l) => levelStat(40, l))).toEqual([40, 44, 48, 52, 56]);
  });

  test('0,5 arrondi au-dessus, sans erreur de virgule : New-reborn Skeleton', () => {
    expect([1, 2, 3, 4, 5].map((l) => levelStat(5, l))).toEqual([5, 6, 6, 7, 7]);
  });

  test('attaque hybride : les deux valeurs augmentent (Fafnir niveau 5)', () => {
    expect(levelDamage(WYRMS_ROSTER.fafnir.damage, 5)).toEqual({ ranged: 42, melee: 63 });
    expect(levelDamage(10, 1)).toBe(10);
  });
});

// Unité de bataille minimale (voir src/logic/unit.js).
const battleUnit = (individualId, { alive = true, killXp = 0, level = 1, faction = 'player' } = {}) => ({
  individualId, faction, level, killXp, isAlive: alive,
});

describe('XP des individus à la victoire (rules.md 11.6)', () => {
  test('+10 pour un individu déployé et vivant, + coût des ennemis achevés', () => {
    const { gains } = individualXpGains([battleUnit('a'), battleUnit('b', { killXp: 16 })]);
    expect(gains.get('a')).toBe(10);
    expect(gains.get('b')).toBe(26);
  });

  test('un individu mort ne gagne rien, même s\'il avait tué ; son niveau est retenu', () => {
    const { gains, dead } = individualXpGains([battleUnit('a', { alive: false, killXp: 110, level: 4 })]);
    expect(gains.has('a')).toBe(false);
    expect(dead.get('a')).toBe(4);
  });

  test('plusieurs déploiements (fuite puis retour) : kills cumulés, survie comptée une fois', () => {
    const { gains } = individualXpGains([battleUnit('a', { killXp: 6 }), battleUnit('a', { killXp: 25 })]);
    expect(gains.get('a')).toBe(41);
  });

  test('mort après une fuite et un redéploiement : rien', () => {
    const { gains, dead } = individualXpGains([battleUnit('a', { killXp: 6 }), battleUnit('a', { alive: false })]);
    expect(gains.has('a')).toBe(false);
    expect(dead.has('a')).toBe(true);
  });

  test('ni les unités de l\'IA ni celles sans individu (clickbait) ne comptent', () => {
    const { gains } = individualXpGains([battleUnit('x', { faction: 'enemy' }), battleUnit(null)]);
    expect(gains.size).toBe(0);
  });

  test('application : morts retirés, XP ajoutée et plafonnée à 500, jamais-déployés inchangés', () => {
    const units = [
      { id: 'a', species: 'lambtonWorm', xp: 45 },
      { id: 'b', species: 'lambtonWorm', xp: 495 },
      { id: 'c', species: 'fafnir', xp: 0 },
      { id: 'd', species: 'amphiptere', xp: 7 },
    ];
    const result = applyVictoryToUnits(units, {
      gains: new Map([['a', 10], ['b', 30]]), dead: new Map([['c', 1]]),
    });
    expect(result).toEqual([
      { id: 'a', species: 'lambtonWorm', xp: 55 },
      { id: 'b', species: 'lambtonWorm', xp: 500 },
      { id: 'd', species: 'amphiptere', xp: 7 },
    ]);
  });

  test('passages de niveau regroupés par espèce et par niveau', () => {
    const before = [
      { id: 'a', species: 'lambtonWorm', xp: 45 },
      { id: 'b', species: 'lambtonWorm', xp: 40 },
      { id: 'c', species: 'lambtonWorm', xp: 0 },
      { id: 'd', species: 'fafnir', xp: 140 },
    ];
    const after = [
      { id: 'a', species: 'lambtonWorm', xp: 55 },
      { id: 'b', species: 'lambtonWorm', xp: 50 },
      { id: 'c', species: 'lambtonWorm', xp: 10 },
      { id: 'd', species: 'fafnir', xp: 310 },
    ];
    expect(levelUps(before, after)).toEqual([
      { species: 'lambtonWorm', from: 1, to: 2, count: 2 },
      { species: 'fafnir', from: 2, to: 4, count: 1 },
    ]);
  });

  test('tri d\'affichage : niveau puis XP décroissants', () => {
    const units = [{ id: 'a', xp: 60 }, { id: 'b', xp: 500 }, { id: 'c', xp: 90 }];
    expect(sortByLevel(units).map((u) => u.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('niveau du joueur (rules.md 11.5)', () => {
  test('500 × N XP pour passer du niveau N à N + 1 : 500, puis 1 500 cumulés', () => {
    expect([1, 2, 3, 4].map(playerXpForLevel)).toEqual([0, 500, 1500, 3000]);
  });

  test('pas de niveau maximum', () => {
    expect(playerLevel(0)).toBe(1);
    expect(playerLevel(499)).toBe(1);
    expect(playerLevel(500)).toBe(2);
    expect(playerLevel(1700)).toBe(3);
    expect(playerLevel(playerXpForLevel(40))).toBe(40);
  });

  test('barre d\'XP du joueur', () => {
    expect(playerProgress(1700)).toEqual({ level: 3, xpInLevel: 200, xpForLevel: 1500 });
  });

  test('bataille 01 : 100 XP fixes', () => {
    expect(FIRST_BATTLE_PLAYER_XP).toBe(100);
  });

  test('victoire : 100 + 100 × PP survivants / PP de l\'armée, arrondi inférieur', () => {
    expect(victoryPlayerXp(375, 375)).toBe(200);
    expect(victoryPlayerXp(375, 0)).toBe(100);
    expect(victoryPlayerXp(300, 199)).toBe(166);
  });

  test('récompense : 50 × nouveau niveau, chaque niveau franchi compté', () => {
    expect(playerLevelReward(400, 499)).toBe(0);
    expect(playerLevelReward(400, 500)).toBe(100);
    expect(playerLevelReward(0, 1500)).toBe(100 + 150);
  });
});
