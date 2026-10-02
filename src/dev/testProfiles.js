import { createUnit } from '../logic/ownedUnits.js';
import { createArmy } from '../logic/army.js';
import {
  clearProgress, savePlayerFaction, markFirstBattleWon, saveOwnedUnits, saveArmy, saveSpiritStones,
  savePlayerXp, saveFallenLegendaryLevel, saveFountainLastHarvest,
} from '../persistence.js';
import { FOUNTAIN_MINUTE_MS } from '../logic/fountain.js';
import { TEXT } from '../ui/strings.js';

// Outil de dev — joueurs de test figés, pour tester à la main l'après-bataille 01 sans la
// rejouer. Chaque profil écrase la sauvegarde (technical.md 5.4) par un état fixe.
// `unitXp` : un individu par valeur, avec cette XP (technical.md 5.7 ; seuils cumulés des
// niveaux : 2 à 50, 3 à 150, 4 à 300, 5 à 500). Tous les individus sont dans l'armée. La Spirit
// Fountain est pleine (dernière récolte il y a 24 h, rules.md 11.8), pour tester la récolte.
const TEST_WYRM = {
  faction: 'wyrms',
  spiritStones: 10000,
  playerXp: 1700, // niveau 3, 200 / 1 500 dans le niveau
  // 3 Vers de Lambton et 1 Amphiptère perdus pendant la bataille 01 : 9 / 7 / 1 survivants.
  unitXp: {
    lambtonWorm: [500, 320, 160, 60, 20, 0, 0, 0, 0],
    amphiptere: [70, 30, 0, 0, 0, 0, 0],
    fafnir: [350],
  },
  fallenLegendaryLevel: null,
};

// Même progression que test-wyrm, côté Morts-Vivants.
const TEST_UNDEAD = {
  faction: 'undead',
  spiritStones: 10000,
  playerXp: 1700, // niveau 3, 200 / 1 500 dans le niveau
  // 4 New-reborn Skeletons et 1 Necromant Initiate perdus pendant la bataille 01 : 14 / 7 / 1
  // survivants (369 PP).
  unitXp: {
    newRebornSkeleton: [500, 320, 160, 60, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    necromantInitiate: [70, 30, 0, 0, 0, 0, 0],
    athos: [350],
  },
  fallenLegendaryLevel: null,
};

export const TEST_PROFILES = {
  testWyrm: TEST_WYRM,
  // Comme test-wyrm, mais Fafnir est mort au niveau 5 : pour tester la réinvocation à niveau
  // gardé (rules.md 11.4).
  testWyrmFallen: { ...TEST_WYRM, unitXp: { ...TEST_WYRM.unitXp, fafnir: [] }, fallenLegendaryLevel: 5 },
  testUndead: TEST_UNDEAD,
};

export function loadTestProfile({
  faction, spiritStones, playerXp, unitXp, fallenLegendaryLevel,
}) {
  const units = Object.entries(unitXp).flatMap(([species, xps]) => xps.map((xp) => createUnit(species, xp)));
  clearProgress();
  savePlayerFaction(faction);
  markFirstBattleWon();
  saveOwnedUnits(units);
  saveArmy(createArmy(TEXT.defaultArmyName, units));
  saveSpiritStones(spiritStones);
  savePlayerXp(playerXp);
  if (fallenLegendaryLevel !== null) saveFallenLegendaryLevel(fallenLegendaryLevel);
  saveFountainLastHarvest(Date.now() - 24 * 60 * FOUNTAIN_MINUTE_MS);
}
