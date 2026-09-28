import { ROSTERS } from '../data/rosters.js';
import {
  savePlayerFaction, markFirstBattleWon, saveOwnedCopies,
} from '../persistence.js';

// Outil de dev — joueurs de test figés, pour tester à la main l'après-bataille 01 sans la
// rejouer. Chaque profil écrase la sauvegarde (technical.md 5.4) par un état fixe.
// `lostCopies` : copies perdues (tuées) pendant la bataille 01, par clé de roster.
export const TEST_PROFILES = {
  // Joueuse Wyrms qui a gagné la bataille 01 en perdant 3 Vers de Lambton et 1 Amphiptère.
  testWyrm: { faction: 'wyrms', lostCopies: { lambtonWorm: 3, amphiptere: 1 } },
};

export function loadTestProfile({ faction, lostCopies }) {
  const ownedCopies = Object.fromEntries(Object.entries(ROSTERS[faction]).map(
    ([key, species]) => [key, species.copies - (lostCopies[key] ?? 0)],
  ));
  savePlayerFaction(faction);
  markFirstBattleWon();
  saveOwnedCopies(ownedCopies);
}
