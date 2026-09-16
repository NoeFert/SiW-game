import Unit from './unit.js';

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

function presenceUsed(faction, unitsOnField) {
  return unitsOnField
    .filter((u) => u.faction === faction)
    .reduce((sum, u) => sum + u.species.cost, 0);
}

// rules.md 2 : dépose une unité pour `faction` — plafond de 150 points de présence vivant
// (dérivé de `unitsOnField`, donc se libère automatiquement à la mort/fuite d'une unité),
// un seul [Légendaire] simultané par camp, et des copies limitées par espèce (une revenue de
// fuite est réutilisée en priorité, avec ses PV réduits conservés, avant d'entamer le stock
// de copies fraîches). Ne contrôle pas le temps elle-même : signale juste l'intention à
// l'appelant (`timeControl: 'pause'`) — le vrai contrôle viendra de Phaser plus tard.
export function deployUnit(state, faction, species, x, y, unitsOnField) {
  if (
    species.keywords.includes('legendary')
    && unitsOnField.some((u) => u.faction === faction && u.species === species)
  ) {
    return { success: false, reason: 'legendaryAlreadyDeployed' };
  }

  if (presenceUsed(faction, unitsOnField) + species.cost > PRESENCE_CAP) {
    return { success: false, reason: 'presenceCapExceeded' };
  }

  const speciesState = state.bySpecies.get(species);
  let hp = species.maxHp;
  if (speciesState.returning.length > 0) {
    hp = speciesState.returning.shift().hp;
  } else if (speciesState.freshRemaining > 0) {
    speciesState.freshRemaining -= 1;
  } else {
    return { success: false, reason: 'noCopiesLeft' };
  }

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

// rules.md 8.1/8.2 : ce camp a-t-il encore une copie disponible (fraîche ou revenue de fuite),
// toutes espèces confondues ?
export function hasAnyReserves(state) {
  for (const speciesState of state.bySpecies.values()) {
    if (speciesState.freshRemaining > 0 || speciesState.returning.length > 0) return true;
  }
  return false;
}
