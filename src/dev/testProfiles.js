import { ROSTERS } from '../data/rosters.js';
import {
  createStartingUnits, countUnitsBySpecies, keepSurvivors, createArmy,
} from '../logic/civilization.js';
import {
  savePlayerFaction, markFirstBattleWon, saveOwnedUnits, saveArmy, saveSpiritStones,
} from '../persistence.js';
import { TEXT } from '../ui/strings.js';

// Outil de dev — joueurs de test figés, pour tester à la main l'après-bataille 01 sans la
// rejouer. Chaque profil écrase la sauvegarde (technical.md 5.4) par un état fixe.
// `lostCopies` : individus perdus (tués) pendant la bataille 01, par clé de roster.
export const TEST_PROFILES = {
  // technical.md 5.7 : joueuse Wyrms qui a gagné la bataille 01 en perdant 3 Vers de Lambton et
  // 1 Amphiptère (9 / 7 / 1 survivants, tous dans l'armée), avec 10 000 Spirit Stones.
  testWyrm: { faction: 'wyrms', lostCopies: { lambtonWorm: 3, amphiptere: 1 }, spiritStones: 10000 },
};

export function loadTestProfile({ faction, lostCopies, spiritStones }) {
  const roster = ROSTERS[faction];
  const startingUnits = createStartingUnits(roster);
  const survivors = Object.fromEntries(Object.entries(countUnitsBySpecies(roster, startingUnits))
    .map(([key, count]) => [key, count - (lostCopies[key] ?? 0)]));
  const units = keepSurvivors(startingUnits, survivors);
  savePlayerFaction(faction);
  markFirstBattleWon();
  saveOwnedUnits(units);
  saveArmy(createArmy(TEXT.defaultArmyName, units));
  saveSpiritStones(spiritStones);
}
