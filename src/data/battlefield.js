// rules.md 1 : 8 obstacles d'une case, dispersés plutôt que concentrés, sans former de
// couloir fermé ni de cul-de-sac. Répartis en 4 paires symétriques de part et d'autre de la
// ligne médiane (x=11.5, la frontière entre les deux moitiés de déploiement, rules.md 2) pour
// que le terrain reste équitable quel que soit le camp choisi par le joueur (rules.md 9).
// Aucun obstacle sur les colonnes 10-13 (couloir central dégagé) ni sur les rangées 0-1/12-13
// (bords de fuite dégagés, rules.md 5) ni sur les cases de déploiement du script IA (voir
// battleScript.js) — vérifié à la main, pas de test dédié (ce sont des coordonnées, pas une
// règle de comportement).
export const BATTLEFIELD_OBSTACLES = [
  { x: 3, y: 3 }, { x: 20, y: 3 },
  { x: 3, y: 10 }, { x: 20, y: 10 },
  { x: 7, y: 6 }, { x: 16, y: 6 },
  { x: 9, y: 11 }, { x: 14, y: 11 },
];
