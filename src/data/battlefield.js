import { parseObstacleMap } from '../logic/grid.js';

// 16 obstacles (rules.md 1) : 12 d'une case et 4 blocs de 2x2 cases (`size: 2`, coordonnées du
// coin haut-gauche, comme pour une unité), dispersés plutôt que concentrés, sans former de
// couloir fermé ni de cul-de-sac. Répartis en 8 paires symétriques de part et d'autre de la
// ligne médiane (x=11.5, la frontière entre les deux moitiés de déploiement, rules.md 2) pour
// que le terrain reste équitable quel que soit le camp choisi par le joueur (rules.md 9) — le
// miroir d'un bloc 2x2 en x a donc son coin en 22 - x.
// Deux de ces paires forment chacune un duo adjacent en diagonale (5,8)-(6,9) à gauche et son
// miroir (18,8)-(17,9) à droite — un duo diagonal ne bloque jamais le passage à lui seul dans
// un déplacement 8 directions (rules.md 3) : les cases orthogonales entre les deux restent
// libres. Aucun obstacle sur les colonnes 10-13 (couloir central dégagé) ni sur les rangées
// 0-1/12-13 (bords de fuite dégagés, rules.md 5).
export const BATTLEFIELD_OBSTACLES = [
  { x: 3, y: 3 }, { x: 20, y: 3 },
  { x: 3, y: 10, size: 2 }, { x: 19, y: 10, size: 2 },
  { x: 7, y: 6, size: 2 }, { x: 15, y: 6, size: 2 },
  { x: 9, y: 11 }, { x: 14, y: 11 },
  { x: 2, y: 2 }, { x: 21, y: 2 },
  { x: 4, y: 5 }, { x: 19, y: 5 },
  // Duos adjacents en diagonale (voir note ci-dessus) :
  { x: 5, y: 8 }, { x: 6, y: 9 },
  { x: 18, y: 8 }, { x: 17, y: 9 },
];

// Zones de la bataille-clickbait (rules.md 7.3), écrites en plan ASCII (voir parseObstacleMap) :
// '.' case libre, '#' rocher d'une case, '@@/@@' rocher 2x2. Colonnes 0-23, rangées 0-13 ;
// le joueur se déploie sur les colonnes 0-11, l'IA entre par la colonne 23 (laissée libre).
// Les murs sont des rochers qui se touchent par un côté : deux rochers qui ne se touchent que
// par un coin laissent passer en diagonale (pathfinding.js). Propriétés vérifiées par
// tests/logic/clickbaitZones.test.js.

// Phase 2 — "Le mur" : un mur qui serpente (colonnes 14-17), percé d'un passage étroit
// (rangée 3, 1 case : une Légendaire 2x2 ne passe pas) et d'un passage large (rangées 10-11).
export const WALL_ZONE_MAP = [
  '................##......',
  '................@@..##..',
  '.........#......@@......',
  '........................',
  '................@@......',
  '...#............@@......',
  '....#..........##.......',
  '...............#...#....',
  '..............@@........',
  '..............@@....@@..',
  '....................@@..',
  '.......@@...............',
  '.......@@.....##........',
  '...............##.......',
];

// Validé mais pas encore utilisé — "Les trois couloirs" : deux crêtes (colonnes 5-19)
// séparent trois couloirs ; seules les unités [Vol] passent de l'un à l'autre.
export const LANES_ZONE_MAP = [
  '........................',
  '.....................#..',
  '........................',
  '.......@@......##@@.....',
  '.....##@@##.@@##.@@#....',
  '......#...##@@..........',
  '........................',
  '........................',
  '.........###..@@........',
  '.....##@@#.###@@#..#....',
  '.......@@.......####....',
  '........................',
  '...#....................',
  '........................',
];

// Phase 3 — "Le fort" : une ruine en fer à cheval côté joueur, salle intérieure 4x4, ouverte
// vers l'ennemi par une entrée de 2 cases (colonne 9, rangées 6-7). Protège du corps-à-corps,
// pas des tirs (pas de ligne de vue, rules.md 4.5). Cul-de-sac assumé, contrairement à rules.md 1.
export const FORT_ZONE_MAP = [
  '........................',
  '........................',
  '.................#......',
  '.....###@@..............',
  '....##..@@..............',
  '....#....#..........@@..',
  '...@@...............@@..',
  '...@@...................',
  '....#....#..............',
  '....##@@##..............',
  '......@@................',
  '................#.......',
  '.#......................',
  '........................',
];

export const WALL_ZONE_OBSTACLES = parseObstacleMap(WALL_ZONE_MAP);
export const LANES_ZONE_OBSTACLES = parseObstacleMap(LANES_ZONE_MAP);
export const FORT_ZONE_OBSTACLES = parseObstacleMap(FORT_ZONE_MAP);
