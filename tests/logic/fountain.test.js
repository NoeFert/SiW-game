import {
  FOUNTAIN_MINUTE_MS, fountainCapacity, fountainContent, harvestFountain,
} from '../../src/logic/fountain.js';

const MIN = FOUNTAIN_MINUTE_MS;
const T0 = 1_000_000_000_000;

describe('Spirit Fountain — capacité (rules.md 11.8)', () => {
  test('20 + 10 × niveau du joueur', () => {
    expect(fountainCapacity(1)).toBe(30);
    expect(fountainCapacity(3)).toBe(50);
    expect(fountainCapacity(10)).toBe(120);
  });
});

describe('Spirit Fountain — production (rules.md 11.8)', () => {
  test('vide à la mise en route', () => {
    expect(fountainContent(T0, T0, 30)).toBe(0);
  });

  test('1 Spirit Stone par minute entière écoulée', () => {
    expect(fountainContent(T0, T0 + MIN - 1, 30)).toBe(0);
    expect(fountainContent(T0, T0 + MIN, 30)).toBe(1);
    expect(fountainContent(T0, T0 + 12.5 * MIN, 30)).toBe(12);
  });

  test('plafonnée à la capacité', () => {
    expect(fountainContent(T0, T0 + 1000 * MIN, 30)).toBe(30);
  });

  test('la capacité est celle du niveau actuel', () => {
    expect(fountainContent(T0, T0 + 45 * MIN, fountainCapacity(1))).toBe(30);
    expect(fountainContent(T0, T0 + 45 * MIN, fountainCapacity(3))).toBe(45);
  });

  test('horloge reculée : jamais négatif', () => {
    expect(fountainContent(T0, T0 - 10 * MIN, 30)).toBe(0);
  });
});

describe('Spirit Fountain — récolte (rules.md 11.8)', () => {
  test('récolte tout le contenu ; la minute entamée est conservée', () => {
    const { collected, lastHarvestMs } = harvestFountain(T0, T0 + 12.5 * MIN, 30);
    expect(collected).toBe(12);
    expect(lastHarvestMs).toBe(T0 + 12 * MIN);
    expect(fountainContent(lastHarvestMs, T0 + 13 * MIN, 30)).toBe(1); // la demi-minute compte
  });

  test('pleine : le surplus est perdu, la production repart de la récolte', () => {
    const now = T0 + 100 * MIN;
    const { collected, lastHarvestMs } = harvestFountain(T0, now, 30);
    expect(collected).toBe(30);
    expect(lastHarvestMs).toBe(now);
  });

  test('vide : sans effet', () => {
    expect(harvestFountain(T0, T0 + 30 * 1000, 30)).toEqual({ collected: 0, lastHarvestMs: T0 });
  });
});
