// technical.md 5.4 : exception ciblée à l'absence de persistance — seules ces cinq valeurs sont
// sauvegardées (roadmap-mvp.md) : de quoi reconstituer l'écran de départ au chargement et
// afficher HomeScreen et CivilizationScreen.
const FACTION_KEY = 'siw.playerFaction';
const FIRST_VICTORY_KEY = 'siw.firstBattleWon';
const OWNED_UNITS_KEY = 'siw.ownedUnits';
const ARMY_KEY = 'siw.army';
const SPIRIT_STONES_KEY = 'siw.spiritStones';
// Ancien format (décompte de copies par espèce), seulement effacé : pas de migration.
const LEGACY_OWNED_COPIES_KEY = 'siw.ownedCopies';

export function getSavedFaction() {
  return localStorage.getItem(FACTION_KEY);
}

export function savePlayerFaction(faction) {
  localStorage.setItem(FACTION_KEY, faction);
}

export function hasWonFirstBattle() {
  return localStorage.getItem(FIRST_VICTORY_KEY) === 'true';
}

export function markFirstBattleWon() {
  localStorage.setItem(FIRST_VICTORY_KEY, 'true');
}

// Liste des individus possédés, chacun { id, species } (rules.md 11.1). `null` si rien n'a
// encore été sauvegardé.
export function getOwnedUnits() {
  return JSON.parse(localStorage.getItem(OWNED_UNITS_KEY));
}

export function saveOwnedUnits(units) {
  localStorage.setItem(OWNED_UNITS_KEY, JSON.stringify(units));
}

// Armée { name, unitIds } (rules.md 11.2). `null` avant la victoire de la bataille 01.
export function getArmy() {
  return JSON.parse(localStorage.getItem(ARMY_KEY));
}

export function saveArmy(army) {
  localStorage.setItem(ARMY_KEY, JSON.stringify(army));
}

// Solde de Spirit Stones, entier (rules.md 11.3).
export function getSpiritStones() {
  return Number(localStorage.getItem(SPIRIT_STONES_KEY) ?? 0);
}

export function saveSpiritStones(amount) {
  localStorage.setItem(SPIRIT_STONES_KEY, String(amount));
}

// technical.md 5.4 : une sauvegarde avec une faction mais sans liste d'individus est à l'ancien
// format — considérée comme absente.
export function isLegacySave() {
  return getSavedFaction() !== null && getOwnedUnits() === null;
}

// Efface toutes les valeurs persistées, comme si l'application n'avait jamais été lancée
// (raccourci "restart game" du menu devs, et sauvegarde à l'ancien format).
export function clearProgress() {
  [FACTION_KEY, FIRST_VICTORY_KEY, OWNED_UNITS_KEY, ARMY_KEY, SPIRIT_STONES_KEY, LEGACY_OWNED_COPIES_KEY]
    .forEach((key) => localStorage.removeItem(key));
}
