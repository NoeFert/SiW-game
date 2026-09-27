import { WYRMS_ROSTER } from './wyrmsRoster.js';
import { UNDEAD_ROSTER } from './undeadRoster.js';

// rules.md 7.1 — timing en temps absolu depuis le début de la bataille, une seule bataille
// scriptée en v1, script symétrique selon la faction jouée par l'IA. Pas de case ici : elle est
// choisie au moment du déploiement selon la situation du terrain (rules.md 7.2, aiScript.js).

// IA jouant les Wyrms — coût total 155, limité par le plafond simultané de 150 (rules.md 7.1).
export const WYRMS_AI_SCRIPT = [
  { time: 0, species: WYRMS_ROSTER.lambtonWorm },
  { time: 8, species: WYRMS_ROSTER.amphiptere },
  { time: 20, species: WYRMS_ROSTER.lambtonWorm },
  { time: 35, species: WYRMS_ROSTER.fafnir },
];

// IA jouant les Morts-Vivants — coût total 147, sous le plafond simultané de 150 (rules.md 7.1).
export const UNDEAD_AI_SCRIPT = [
  { time: 0, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 8, species: UNDEAD_ROSTER.necromantInitiate },
  { time: 20, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 35, species: UNDEAD_ROSTER.athos },
];
