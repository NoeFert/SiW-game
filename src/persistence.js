// technical.md 5.4 : exception ciblée à l'absence de persistance en v1 — seules ces trois
// valeurs sont sauvegardées : de quoi reconstituer l'écran de départ au chargement et afficher
// CivilizationScreen.
const FACTION_KEY = 'siw.playerFaction';
const FIRST_VICTORY_KEY = 'siw.firstBattleWon';
const OWNED_COPIES_KEY = 'siw.ownedCopies';

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

// Copies possédées par clé de roster (ex : { lambtonWorm: 9, ... }), figées à la victoire du
// tutoriel. `null` si rien n'a encore été sauvegardé.
export function getOwnedCopies() {
  return JSON.parse(localStorage.getItem(OWNED_COPIES_KEY));
}

export function saveOwnedCopies(ownedCopies) {
  localStorage.setItem(OWNED_COPIES_KEY, JSON.stringify(ownedCopies));
}

// Outil de test temporaire (bouton "Reset Demo" sur HomeScreen) : efface toutes les valeurs
// persistées en v1, comme si l'application n'avait jamais été lancée.
export function clearProgress() {
  localStorage.removeItem(FACTION_KEY);
  localStorage.removeItem(FIRST_VICTORY_KEY);
  localStorage.removeItem(OWNED_COPIES_KEY);
}
