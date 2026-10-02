// Statique — tracé de la map de « Partir en guerre » (rules.md 11.7, GRAPHICS.md « Partir en
// guerre ») : une case de grille par emplacement, dans l'ordre du parcours (col vers la droite,
// row vers le bas). Deux emplacements qui se suivent sont toujours sur la même ligne ou la même
// colonne. Les premiers emplacements portent les batailles de WAR_BATTLE_IDS (src/data/battles.js),
// dans l'ordre ; les suivants sont affichés verrouillés, en attendant leurs batailles.
export const WAR_MAP_1 = {
  cols: 5,
  rows: 4,
  // Lacets qui montent vers la droite : 3 batailles en bas, un virage, retour vers la gauche,
  // puis la montée vers le sommet à droite.
  slots: [
    { col: 0, row: 3 },
    { col: 1, row: 3 },
    { col: 2, row: 3 },
    { col: 2, row: 2 },
    { col: 1, row: 2 },
    { col: 1, row: 1 },
    { col: 2, row: 1 },
    { col: 3, row: 1 },
    { col: 3, row: 0 },
    { col: 4, row: 0 },
  ],
};
