import Unit from './unit.js';
import { isPositionFree, occupiedCells } from './pathfinding.js';

// rules.md 2 : plafond vivant de points de présence, identique pour chaque camp.
export const PRESENCE_CAP = 150;

// État de réserve d'un camp : par espèce, combien de copies "fraîches" (jamais encore
// déployées) restent, et la liste des copies revenues de fuite (PV réduits conservés,
// redéployables). Une copie tuée n'est jamais remise dans l'une ou l'autre : elle est perdue
// définitivement (rules.md 2/4.4) simplement en n'y étant jamais rajoutée.
export function createDeploymentState(roster) {
  const bySpecies = new Map();
  for (const species of Object.values(roster)) {
    bySpecies.set(species, { freshRemaining: species.copies, returning: [] });
  }
  return { bySpecies };
}

export function getPresenceUsed(faction, unitsOnField) {
  return unitsOnField
    .filter((u) => u.faction === faction)
    .reduce((sum, u) => sum + u.species.cost, 0);
}

// Réserve actuelle d'une espèce pour l'UI : copies fraîches + PV de chacune des copies
// revenues de fuite (pour un badge/tooltip "PV réduits", rules.md 2).
export function getReserve(state, species) {
  const speciesState = state.bySpecies.get(species);
  return {
    fresh: speciesState.freshRemaining,
    returningHp: speciesState.returning.map((entry) => entry.hp),
  };
}

// rules.md 1/2 : une position de déploiement doit rester dans les limites du terrain, sur la
// moitié du camp concerné, hors obstacle, et libre de toute autre unité déjà présente.
// Séparée de `deployUnit` (qui ne connaît pas la grille) pour ne pas casser sa signature.
export function isValidDeploymentPosition(grid, faction, species, x, y, unitsOnField) {
  const halfWidth = Math.floor(grid.width / 2);
  const withinHalf = faction === 'player'
    ? x >= 0 && x + species.size <= halfWidth
    : x >= halfWidth && x + species.size <= grid.width;
  if (!withinHalf) return false;

  return isPositionFree(x, y, species.size, grid, occupiedCells(unitsOnField, null), false);
}

// Prélève une copie précise dans la réserve selon `copyChoice` :
// - 'fresh' : exige une copie fraîche (jamais déployée), refuse même si une copie revenue de
//   fuite existe.
// - un nombre : exige la copie revenue de fuite ayant EXACTEMENT ces PV.
// - omis/null : comportement historique — revenue de fuite en priorité, puis fraîche.
// Sépararé de `deployUnit` pour rester lisible ; ne fait que muter `speciesState` ou renvoyer
// null si la copie demandée n'est pas disponible.
function takeCopy(speciesState, species, copyChoice) {
  if (copyChoice === 'fresh') {
    if (speciesState.freshRemaining <= 0) return null;
    speciesState.freshRemaining -= 1;
    return species.maxHp;
  }

  if (typeof copyChoice === 'number') {
    const index = speciesState.returning.findIndex((entry) => entry.hp === copyChoice);
    if (index === -1) return null;
    return speciesState.returning.splice(index, 1)[0].hp;
  }

  if (speciesState.returning.length > 0) return speciesState.returning.shift().hp;
  if (speciesState.freshRemaining > 0) {
    speciesState.freshRemaining -= 1;
    return species.maxHp;
  }
  return null;
}

// rules.md 2 : dépose une unité pour `faction` — plafond de 150 points de présence vivant
// (dérivé de `unitsOnField`, donc se libère automatiquement à la mort/fuite d'une unité),
// un seul [Légendaire] simultané par camp, et des copies limitées par espèce. `copyChoice`
// permet à l'appelant (la sidebar de déploiement) de garantir la copie exacte affichée —
// fraîche ('fresh') ou une copie revenue de fuite à des PV précis — plutôt que de laisser le
// choix par défaut (revenue de fuite en priorité, voir `takeCopy`). Ne vérifie pas la position
// (voir `isValidDeploymentPosition`) ni le temps : signale juste l'intention à l'appelant
// (`timeControl: 'pause'`).
export function deployUnit(state, faction, species, x, y, unitsOnField, copyChoice = null) {
  if (
    species.keywords.includes('legendary')
    && unitsOnField.some((u) => u.faction === faction && u.species === species)
  ) {
    return { success: false, reason: 'legendaryAlreadyDeployed' };
  }

  if (getPresenceUsed(faction, unitsOnField) + species.cost > PRESENCE_CAP) {
    return { success: false, reason: 'presenceCapExceeded' };
  }

  const hp = takeCopy(state.bySpecies.get(species), species, copyChoice);
  if (hp === null) return { success: false, reason: 'noCopiesLeft' };

  const unit = new Unit(species, faction, x, y);
  unit.hp = hp;

  return { success: true, unit, timeControl: 'pause' };
}

// rules.md 2 : à appeler quand une unité quitte le terrain en fuite (rules.md 5) — sa copie
// retourne en réserve avec ses PV réduits conservés, jamais perdue contrairement à une mort.
export function recordReturn(state, unit) {
  state.bySpecies.get(unit.species).returning.push({ hp: unit.hp });
}

// rules.md 7 : les déploiements scriptés de l'IA (aiScript.js) sont pré-autorisés — le script
// est déjà équilibré (rules.md 7.1) — donc pas de vérification de plafond/légendaire ici, juste
// la tenue du registre de copies pour que les réserves restent exactes pour battleEnd.js (8).
export function consumeFreshCopy(state, species) {
  const speciesState = state.bySpecies.get(species);
  speciesState.freshRemaining = Math.max(0, speciesState.freshRemaining - 1);
}

// rules.md 2 / technical.md 5.4 : copies encore possédées par espèce, indexées par clé de roster
// (ex : { lambtonWorm: 9, ... }). Une copie tuée n'est plus nulle part ; toutes les autres sont
// soit en réserve (fraîches ou revenues de fuite), soit encore sur le terrain.
export function countOwnedCopies(roster, state, faction, unitsOnField) {
  return Object.fromEntries(Object.entries(roster).map(([key, species]) => {
    const speciesState = state.bySpecies.get(species);
    const onField = unitsOnField.filter((u) => u.faction === faction && u.species === species).length;
    return [key, speciesState.freshRemaining + speciesState.returning.length + onField];
  }));
}

// rules.md 8.1/8.2 : ce camp a-t-il encore une copie disponible (fraîche ou revenue de fuite),
// toutes espèces confondues ?
export function hasAnyReserves(state) {
  for (const speciesState of state.bySpecies.values()) {
    if (speciesState.freshRemaining > 0 || speciesState.returning.length > 0) return true;
  }
  return false;
}
