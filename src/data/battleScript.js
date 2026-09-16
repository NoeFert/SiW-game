import { WYRMS_ROSTER } from './wyrmsRoster.js';
import { UNDEAD_ROSTER } from './undeadRoster.js';

// rules.md 7.1 — timing en temps absolu depuis le début de la bataille, une seule bataille
// scriptée en v1, script symétrique selon la faction jouée par l'IA. Positions de déploiement
// à titre indicatif : comme les obstacles de la grille (rules.md 1), l'emplacement exact
// relève de la construction du niveau et n'est pas encore tranché dans les specs.

// IA jouant les Wyrms — budget total 155 points de présence (rules.md 7.1).
export const WYRMS_AI_SCRIPT = [
  { time: 0, species: WYRMS_ROSTER.lambtonWorm, x: 20, y: 4 },
  { time: 8, species: WYRMS_ROSTER.amphiptere, x: 20, y: 9 },
  { time: 20, species: WYRMS_ROSTER.lambtonWorm, x: 20, y: 11 },
  { time: 35, species: WYRMS_ROSTER.fafnir, x: 20, y: 6 },
];

// IA jouant les Morts-Vivants — budget total 147 points de présence (rules.md 7.1).
export const UNDEAD_AI_SCRIPT = [
  { time: 0, species: UNDEAD_ROSTER.newRebornSkeleton, x: 20, y: 4 },
  { time: 8, species: UNDEAD_ROSTER.necromantInitiate, x: 20, y: 9 },
  { time: 20, species: UNDEAD_ROSTER.newRebornSkeleton, x: 20, y: 11 },
  { time: 35, species: UNDEAD_ROSTER.athos, x: 20, y: 6 },
];
