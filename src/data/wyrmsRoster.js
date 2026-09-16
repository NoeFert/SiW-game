// Statique — définitions d'espèce de la Souveraine des Wyrms (units.md).
// `size` = côté du bloc carré occupé en cases (1, ou 2 pour un bloc 2x2/4 cases).
// `range` = null pour une unité sans attaque à distance.
export const WYRMS_ROSTER = {
  lambtonWorm: {
    name: 'Lambton Worm',
    keywords: [],
    attackType: 'melee',
    size: 1,
    cost: 10,
    maxHp: 40,
    damage: 8,
    moveSpeed: 2.5,
    attackSpeed: 1.0,
    range: null,
    copies: 12,
  },
  amphiptere: {
    name: 'Amphiptère',
    keywords: ['flying'],
    attackType: 'ranged',
    size: 1,
    cost: 25,
    maxHp: 18,
    damage: 10,
    moveSpeed: 4,
    attackSpeed: 1.3,
    range: 4,
    copies: 8,
  },
  fafnir: {
    name: 'Fafnir the Cursed One',
    keywords: ['legendary', 'flying'],
    attackType: 'hybrid',
    size: 2,
    cost: 110,
    maxHp: 220,
    damage: { ranged: 30, melee: 45 },
    moveSpeed: 1.5,
    attackSpeed: 1.8,
    range: 3,
    copies: 1,
    abilities: [
      { trigger: 'periodic', every: 5, type: 'bonusDamage', multiplier: 2, name: 'Attaque dévastatrice' },
    ],
  },
};
