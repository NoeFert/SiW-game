import { WYRMS_ROSTER } from './wyrmsRoster.js';
import { UNDEAD_ROSTER } from './undeadRoster.js';

// Roster de chaque faction jouable (rules.md 9, units.md), indexé par la valeur persistée de
// la faction choisie (voir persistence.js).
export const ROSTERS = {
  wyrms: WYRMS_ROSTER,
  undead: UNDEAD_ROSTER,
};
