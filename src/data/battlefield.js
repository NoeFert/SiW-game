// 16 obstacles d'une case (doublé depuis les 8 de rules.md 1, à la demande explicite — la spec
// n'a pas été mise à jour en conséquence), dispersés plutôt que concentrés, sans former de
// couloir fermé ni de cul-de-sac. Répartis en 8 paires symétriques de part et d'autre de la
// ligne médiane (x=11.5, la frontière entre les deux moitiés de déploiement, rules.md 2) pour
// que le terrain reste équitable quel que soit le camp choisi par le joueur (rules.md 9).
// Deux de ces paires forment chacune un duo adjacent en diagonale (5,8)-(6,9) à gauche et son
// miroir (18,8)-(17,9) à droite — un duo diagonal ne bloque jamais le passage à lui seul dans
// un déplacement 8 directions (rules.md 3) : les cases orthogonales entre les deux restent
// libres. Aucun obstacle sur les colonnes 10-13 (couloir central dégagé) ni sur les rangées
// 0-1/12-13 (bords de fuite dégagés, rules.md 5) ni sur les cases de déploiement du script IA
// (voir battleScript.js) — vérifié à la main, pas de test dédié (ce sont des coordonnées, pas
// une règle de comportement).
export const BATTLEFIELD_OBSTACLES = [
  { x: 3, y: 3 }, { x: 20, y: 3 },
  { x: 3, y: 10 }, { x: 20, y: 10 },
  { x: 7, y: 6 }, { x: 16, y: 6 },
  { x: 9, y: 11 }, { x: 14, y: 11 },
  { x: 2, y: 2 }, { x: 21, y: 2 },
  { x: 4, y: 5 }, { x: 19, y: 5 },
  // Duos adjacents en diagonale (voir note ci-dessus) :
  { x: 5, y: 8 }, { x: 6, y: 9 },
  { x: 18, y: 8 }, { x: 17, y: 9 },
];
