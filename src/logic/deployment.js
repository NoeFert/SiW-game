import Unit from './unit.js';
import { isPositionFree, occupiedCells } from './pathfinding.js';
import { individualLevel, levelDamage, levelStat } from './levels.js';

// rules.md 2 : plafond vivant de points de présence, identique pour chaque camp.
export const PRESENCE_CAP = 150;

// État de réserve d'un camp : par espèce, combien de copies "fraîches" (jamais encore
// déployées) restent, et la liste des copies revenues de fuite (PV réduits conservés,
// redéployables). Une copie tuée n'est jamais remise dans l'une ou l'autre : elle est perdue
// définitivement (rules.md 2/4.4) simplement en n'y étant jamais rajoutée.
// `individuals` (jeu normal, rules.md 2 et 11.6) : individus possédés du joueur { id, species,
// xp } — chaque copie fraîche est alors un individu précis, avec son niveau
// (`freshIndividuals`, niveaux décroissants). Sans eux (IA, version clickbait), les copies de
// `units.md`, anonymes et niveau 1.
export function createDeploymentState(roster, individuals = null) {
  const bySpecies = new Map();
  for (const [key, species] of Object.entries(roster)) {
    const freshIndividuals = individuals && individuals
      .filter((unit) => unit.species === key)
      .map((unit) => ({ individualId: unit.id, level: individualLevel(unit.xp) }))
      .sort((a, b) => b.level - a.level);
    bySpecies.set(species, {
      freshRemaining: freshIndividuals ? freshIndividuals.length : species.copies,
      returning: [],
      freshIndividuals,
    });
  }
  return { bySpecies, withLevels: individuals !== null };
}

export function getPresenceUsed(faction, unitsOnField) {
  return unitsOnField
    .filter((u) => u.faction === faction)
    .reduce((sum, u) => sum + u.species.cost, 0);
}

// Réserve actuelle d'une espèce : copies fraîches + PV de chacune des copies revenues de fuite
// (rules.md 2).
export function getReserve(state, species) {
  const speciesState = state.bySpecies.get(species);
  return {
    fresh: speciesState.freshRemaining,
    returningHp: speciesState.returning.map((entry) => entry.hp),
  };
}

// Lignes de la tour de commandement (ui-battle-screen-decisions.md 2.2) : uniquement les
// copies en réserve (ni mortes, ni sur le terrain). Deux copies partagent une ligne seulement
// si elles sont strictement identiques : même espèce, même niveau (rules.md 11.6) et mêmes PV
// actuels. Les traits (v2+) s'ajouteront à cette clé.
// Ordre : roster, puis niveaux décroissants, puis copies intactes et blessés (PV décroissants)
// juste sous leur groupe. `deployable` est faux si le coût dépasse le budget restant (ou si le
// [Légendaire] est déjà déployé). `copyChoice` ({ level, hp }) est à transmettre à deployUnit.
// `showLevel` : le niveau n'est affiché que dans le jeu normal.
export function getTowerRows(state, faction, unitsOnField) {
  const remainingBudget = PRESENCE_CAP - getPresenceUsed(faction, unitsOnField);
  const rows = [];
  for (const [species, speciesState] of state.bySpecies) {
    const legendaryOnField = species.keywords.includes('legendary')
      && unitsOnField.some((u) => u.faction === faction && u.species === species);

    // Une copie revenue de fuite sans blessure est identique à une fraîche : même ligne.
    const groups = new Map();
    const add = (level, hp) => {
      const key = `${level}:${hp}`;
      const group = groups.get(key) ?? { level, hp, count: 0 };
      group.count += 1;
      groups.set(key, group);
    };
    if (speciesState.freshIndividuals) {
      for (const { level } of speciesState.freshIndividuals) add(level, levelStat(species.maxHp, level));
    } else if (speciesState.freshRemaining > 0) {
      groups.set(`1:${species.maxHp}`, { level: 1, hp: species.maxHp, count: speciesState.freshRemaining });
    }
    for (const { level, hp } of speciesState.returning) add(level, hp);

    [...groups.values()]
      .sort((a, b) => b.level - a.level || b.hp - a.hp)
      .forEach(({ level, hp, count }) => {
        const maxHp = levelStat(species.maxHp, level);
        rows.push({
          species,
          copyChoice: { level, hp },
          count,
          level,
          showLevel: state.withLevels,
          hp,
          maxHp,
          damage: levelDamage(species.damage, level),
          cost: species.cost,
          keywords: species.keywords,
          attackType: species.attackType,
          wounded: hp < maxHp,
          deployable: species.cost <= remainingBudget && !legendaryOnField,
        });
      });
  }
  return rows;
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

// Prélève une copie fraîche (jamais déployée) d'un niveau donné (`null` : la première venue,
// donc du plus haut niveau). Renvoie { hp, level, individualId } ou null.
function takeFresh(speciesState, species, level) {
  if (speciesState.freshRemaining <= 0) return null;
  if (!speciesState.freshIndividuals) {
    if (level !== null && level !== 1) return null;
    speciesState.freshRemaining -= 1;
    return { hp: species.maxHp, level: 1, individualId: null };
  }
  const index = level === null ? 0 : speciesState.freshIndividuals.findIndex((entry) => entry.level === level);
  if (index === -1) return null;
  const [entry] = speciesState.freshIndividuals.splice(index, 1);
  speciesState.freshRemaining -= 1;
  return { hp: levelStat(species.maxHp, entry.level), level: entry.level, individualId: entry.individualId };
}

// Prélève une copie précise dans la réserve selon `copyChoice` :
// - 'fresh' : exige une copie fraîche (jamais déployée), refuse même si une copie revenue de
//   fuite existe.
// - { level, hp } (lignes de la tour) ou un nombre (= PV, niveau 1) : exige une copie de ce
//   niveau ayant EXACTEMENT ces PV — une revenue de fuite, ou une fraîche si ces PV sont les PV
//   max du niveau (les deux sont alors strictement identiques, voir getTowerRows).
// - omis/null : comportement historique — revenue de fuite en priorité, puis fraîche.
// Ne fait que muter `speciesState`, et renvoie { hp, level, individualId } ou null si la copie
// demandée n'est pas disponible.
function takeCopy(speciesState, species, copyChoice) {
  if (copyChoice === 'fresh') return takeFresh(speciesState, species, null);

  if (copyChoice !== null) {
    const { level, hp } = typeof copyChoice === 'number' ? { level: 1, hp: copyChoice } : copyChoice;
    const index = speciesState.returning.findIndex((entry) => entry.level === level && entry.hp === hp);
    if (index !== -1) return speciesState.returning.splice(index, 1)[0];
    return hp === levelStat(species.maxHp, level) ? takeFresh(speciesState, species, level) : null;
  }

  if (speciesState.returning.length > 0) return speciesState.returning.shift();
  return takeFresh(speciesState, species, null);
}

// rules.md 2 : dépose une unité pour `faction` — plafond de 150 points de présence vivant
// (dérivé de `unitsOnField`, donc se libère automatiquement à la mort/fuite d'une unité),
// un seul [Légendaire] simultané par camp, et des copies limitées par espèce. `copyChoice`
// permet à l'appelant (la tour de commandement) de garantir la copie exacte affichée —
// fraîche ('fresh'), ou d'un niveau et de PV précis ({ level, hp }) — plutôt que de laisser le
// choix par défaut (revenue de fuite en priorité, voir `takeCopy`). L'unité déployée porte le
// niveau et l'individu de la copie (rules.md 11.6). Ne vérifie pas la position
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

  const copy = takeCopy(state.bySpecies.get(species), species, copyChoice);
  if (copy === null) return { success: false, reason: 'noCopiesLeft' };

  const unit = new Unit(species, faction, x, y, copy.level, copy.individualId);
  unit.hp = copy.hp;

  return { success: true, unit, timeControl: 'pause' };
}

// rules.md 2 : à appeler quand une unité quitte le terrain en fuite (rules.md 5) — sa copie
// retourne en réserve avec ses PV réduits conservés (et son niveau et son individu), jamais
// perdue contrairement à une mort.
export function recordReturn(state, unit) {
  state.bySpecies.get(unit.species).returning.push({
    hp: unit.hp, level: unit.level, individualId: unit.individualId,
  });
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

// Bilan de fin de bataille (technical.md 5.6), dans l'ordre du roster : pour chaque espèce, les
// copies encore en vie (sur le terrain ou en réserve) et les copies perdues (tuées, rules.md 4.4).
export function getCasualtyReport(roster, state, faction, unitsOnField) {
  const owned = countOwnedCopies(roster, state, faction, unitsOnField);
  return Object.entries(roster).map(([key, species]) => ({
    species, alive: owned[key], lost: species.copies - owned[key],
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
