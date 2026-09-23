// technical.md 5.4 : exception ciblée à l'absence de persistance en v1 — seules ces deux
// valeurs sont sauvegardées, juste assez pour reconstituer l'écran de départ au chargement.
const FACTION_KEY = 'siw.playerFaction';
const FIRST_VICTORY_KEY = 'siw.firstBattleWon';

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

// Outil de test temporaire (bouton "Reset Demo" sur HomeScreen) : efface les deux seules
// valeurs persistées en v1, comme si l'application n'avait jamais été lancée.
export function clearProgress() {
  localStorage.removeItem(FACTION_KEY);
  localStorage.removeItem(FIRST_VICTORY_KEY);
}
