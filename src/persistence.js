// technical.md 5.4 : exception ciblée à l'absence de persistance — seules ces neuf valeurs sont
// sauvegardées (roadmap-mvp.md) : de quoi reconstituer l'écran de départ au chargement et
// afficher HomeScreen, CivilizationScreen, SummonScreen et WarScreen.
const FACTION_KEY = 'siw.playerFaction';
const FIRST_VICTORY_KEY = 'siw.firstBattleWon';
const OWNED_UNITS_KEY = 'siw.ownedUnits';
const ARMY_KEY = 'siw.army';
const SPIRIT_STONES_KEY = 'siw.spiritStones';
const PLAYER_XP_KEY = 'siw.playerXp';
const FALLEN_LEGENDARY_LEVEL_KEY = 'siw.fallenLegendaryLevel';
const WON_WAR_BATTLES_KEY = 'siw.wonWarBattles';
const FOUNTAIN_LAST_HARVEST_KEY = 'siw.fountainLastHarvest';
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

// Liste des individus possédés, chacun { id, species, xp } (rules.md 11.1). `null` si rien n'a
// encore été sauvegardé. technical.md 5.4 : un individu sauvegardé sans `xp` compte pour 0.
export function getOwnedUnits() {
  const units = JSON.parse(localStorage.getItem(OWNED_UNITS_KEY));
  return units && units.map((unit) => ({ ...unit, xp: unit.xp ?? 0 }));
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

// XP du joueur, entier (rules.md 11.5) ; 0 si rien n'a encore été sauvegardé.
export function getPlayerXp() {
  return Number(localStorage.getItem(PLAYER_XP_KEY) ?? 0);
}

export function savePlayerXp(xp) {
  localStorage.setItem(PLAYER_XP_KEY, String(xp));
}

// Niveau du [Légendaire] à sa dernière mort (rules.md 11.4), `null` s'il n'est jamais mort.
export function getFallenLegendaryLevel() {
  const level = localStorage.getItem(FALLEN_LEGENDARY_LEVEL_KEY);
  return level === null ? null : Number(level);
}

export function saveFallenLegendaryLevel(level) {
  localStorage.setItem(FALLEN_LEGENDARY_LEVEL_KEY, String(level));
}

// Identifiants des batailles de « Partir en guerre » gagnées (rules.md 11.7) ; [] au départ.
export function getWonWarBattles() {
  return JSON.parse(localStorage.getItem(WON_WAR_BATTLES_KEY)) ?? [];
}

export function saveWonWarBattles(battleIds) {
  localStorage.setItem(WON_WAR_BATTLES_KEY, JSON.stringify(battleIds));
}

// Heure (ms) de la dernière récolte de la Spirit Fountain (rules.md 11.8), `null` tant qu'elle
// n'est pas en route.
export function getFountainLastHarvest() {
  const time = localStorage.getItem(FOUNTAIN_LAST_HARVEST_KEY);
  return time === null ? null : Number(time);
}

export function saveFountainLastHarvest(timeMs) {
  localStorage.setItem(FOUNTAIN_LAST_HARVEST_KEY, String(timeMs));
}

// technical.md 5.4 : une sauvegarde avec une faction mais sans liste d'individus est à l'ancien
// format — considérée comme absente.
export function isLegacySave() {
  return getSavedFaction() !== null && getOwnedUnits() === null;
}

// Efface toutes les valeurs persistées, comme si l'application n'avait jamais été lancée
// (raccourci "restart game" du menu devs, profils de test, et sauvegarde à l'ancien format).
export function clearProgress() {
  [
    FACTION_KEY, FIRST_VICTORY_KEY, OWNED_UNITS_KEY, ARMY_KEY, SPIRIT_STONES_KEY, PLAYER_XP_KEY,
    FALLEN_LEGENDARY_LEVEL_KEY, WON_WAR_BATTLES_KEY, FOUNTAIN_LAST_HARVEST_KEY,
    LEGACY_OWNED_COPIES_KEY,
  ].forEach((key) => localStorage.removeItem(key));
}
