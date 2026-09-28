import { WYRMS_ROSTER } from './wyrmsRoster.js';
import { UNDEAD_ROSTER } from './undeadRoster.js';

// rules.md 7.1 — timing en temps absolu depuis le début de la bataille, une seule bataille
// scriptée en v1, script symétrique selon la faction jouée par l'IA. Pas de case ici : elle est
// choisie au moment du déploiement selon la situation du terrain (rules.md 7.2, aiScript.js).
// Une vague de plusieurs unités = plusieurs entrées au même instant.

// IA jouant les Wyrms — coût total 175, limité par le plafond simultané de 150 (rules.md 7.1).
export const WYRMS_AI_SCRIPT = [
  { time: 0, species: WYRMS_ROSTER.lambtonWorm },
  { time: 8, species: WYRMS_ROSTER.amphiptere },
  { time: 20, species: WYRMS_ROSTER.lambtonWorm },
  { time: 28, species: WYRMS_ROSTER.lambtonWorm },
  { time: 28, species: WYRMS_ROSTER.lambtonWorm },
  { time: 35, species: WYRMS_ROSTER.fafnir },
];

// rules.md 7.3 — bataille-clickbait, phase 2 : "extension de vague" provisoire, temps comptés
// depuis le début de la phase 2. 2 basiques, 1 [Vol], puis 2 basiques.
export const WYRMS_CLICKBAIT_PHASE_2_SCRIPT = [
  { time: 0, species: WYRMS_ROSTER.lambtonWorm },
  { time: 0, species: WYRMS_ROSTER.lambtonWorm },
  { time: 5, species: WYRMS_ROSTER.amphiptere },
  { time: 12, species: WYRMS_ROSTER.lambtonWorm },
  { time: 12, species: WYRMS_ROSTER.lambtonWorm },
];

export const UNDEAD_CLICKBAIT_PHASE_2_SCRIPT = [
  { time: 0, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 0, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 5, species: UNDEAD_ROSTER.necromantInitiate },
  { time: 12, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 12, species: UNDEAD_ROSTER.newRebornSkeleton },
];

// IA jouant les Morts-Vivants — coût total 159, limité par le plafond simultané de 150 (rules.md 7.1).
export const UNDEAD_AI_SCRIPT = [
  { time: 0, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 8, species: UNDEAD_ROSTER.necromantInitiate },
  { time: 20, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 28, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 28, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 35, species: UNDEAD_ROSTER.athos },
];
