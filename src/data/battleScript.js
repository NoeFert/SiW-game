import { WYRMS_ROSTER } from './wyrmsRoster.js';
import { UNDEAD_ROSTER } from './undeadRoster.js';

// rules.md 7.1 — timing en temps absolu depuis le début de la bataille, une seule bataille
// scriptée en v1, script symétrique selon la faction jouée par l'IA. Positions choisies dans
// la moitié IA du terrain (x >= 12, rules.md 2), réparties sur des colonnes/rangées
// différentes plutôt qu'empilées sur une seule colonne, et vérifiées à la main pour ne
// chevaucher aucun obstacle de battlefield.js.

// IA jouant les Wyrms — budget total 155 points de présence (rules.md 7.1).
export const WYRMS_AI_SCRIPT = [
  { time: 0, species: WYRMS_ROSTER.lambtonWorm, x: 15, y: 4 },
  { time: 8, species: WYRMS_ROSTER.amphiptere, x: 18, y: 9 },
  { time: 20, species: WYRMS_ROSTER.lambtonWorm, x: 15, y: 10 },
  { time: 35, species: WYRMS_ROSTER.fafnir, x: 17, y: 6 }, // occupe (17,6)-(18,7)
];

// IA jouant les Morts-Vivants — budget total 147 points de présence (rules.md 7.1).
export const UNDEAD_AI_SCRIPT = [
  { time: 0, species: UNDEAD_ROSTER.newRebornSkeleton, x: 15, y: 4 },
  { time: 8, species: UNDEAD_ROSTER.necromantInitiate, x: 18, y: 9 },
  { time: 20, species: UNDEAD_ROSTER.newRebornSkeleton, x: 15, y: 10 },
  { time: 35, species: UNDEAD_ROSTER.athos, x: 17, y: 6 }, // occupe (17,6)-(18,7)
];
