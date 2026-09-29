// Couche méta du jeu normal (rules.md 11) : individus possédés et armée. Logique pure, sans
// Phaser ni localStorage (la sauvegarde vit dans persistence.js).

// rules.md 11.1 : un individu n'a qu'un identifiant et une espèce (clé de roster). L'identifiant
// vient de crypto.randomUUID(), jamais de la taille de la liste (technical.md 5.4).
export function createUnit(species) {
  return { id: crypto.randomUUID(), species };
}

// rules.md 11.1 : dotation de départ = « Copies de départ » de chaque espèce (units.md).
export function createStartingUnits(roster) {
  return Object.entries(roster).flatMap(
    ([key, species]) => Array.from({ length: species.copies }, () => createUnit(key)),
  );
}

// Nombre d'individus par clé de roster (ex : { lambtonWorm: 9, ... }), 0 pour une espèce absente.
export function countUnitsBySpecies(roster, units) {
  const counts = Object.fromEntries(Object.keys(roster).map((key) => [key, 0]));
  for (const unit of units) counts[unit.species] += 1;
  return counts;
}

// rules.md 11.1 : à la victoire, les individus tués sont retirés. Les individus d'une espèce étant
// indiscernables, on garde les `survivors[espèce]` premiers de chaque espèce.
export function keepSurvivors(units, survivors) {
  const kept = {};
  return units.filter((unit) => {
    kept[unit.species] = (kept[unit.species] ?? 0) + 1;
    return kept[unit.species] <= (survivors[unit.species] ?? 0);
  });
}

// rules.md 11.2 : une armée est un nom et une liste d'identifiants d'individus.
export function createArmy(name, units) {
  return { name, unitIds: units.map((unit) => unit.id) };
}

// rules.md 10 : somme de départ en Spirit Stones, donnée au choix de la faction. Provisoire (0)
// tant que l'économie n'est pas chiffrée (roadmap-mvp.md, étape 6).
export const STARTING_SPIRIT_STONES = 0;

// Individus possédés présents dans l'armée (rules.md 11.2).
export function armyUnits(army, units) {
  const ids = new Set(army?.unitIds ?? []);
  return units.filter((unit) => ids.has(unit.id));
}

// rules.md 11.4 : action d'invocation d'une espèce, selon le nombre d'individus possédés —
// 'summon' (Invoquer), 'resummon' (Réinvoquer : [Légendaire] mort) ou 'alreadyOwned'
// ([Légendaire] vivant, « Déjà à vos côtés »).
export function summonAction(species, ownedCount) {
  if (!species.keywords.includes('legendary')) return 'summon';
  return ownedCount > 0 ? 'alreadyOwned' : 'resummon';
}

// rules.md 11.2 : plafond de coût d'une armée, en points de présence (distinct des 150 du terrain).
export const ARMY_PP_CAP = 500;
export const ARMY_NAME_MAX_LENGTH = 20;

export function armyCost(army, units, roster) {
  return armyUnits(army, units).reduce((sum, unit) => sum + roster[unit.species].cost, 0);
}

// Un individu possédé de cette espèce, hors de l'armée (n'importe lequel : ils sont
// indiscernables, rules.md 11.1).
function unitOutsideArmy(army, units, speciesKey) {
  const ids = new Set(army.unitIds);
  return units.find((unit) => unit.species === speciesKey && !ids.has(unit.id));
}

// rules.md 11.2 : ajout d'un individu d'une espèce, impossible s'il n'en reste aucun hors de
// l'armée ou si le coût dépasserait 500.
export function canAddToArmy(army, units, roster, speciesKey) {
  return unitOutsideArmy(army, units, speciesKey) !== undefined
    && armyCost(army, units, roster) + roster[speciesKey].cost <= ARMY_PP_CAP;
}

export function addToArmy(army, units, roster, speciesKey) {
  if (!canAddToArmy(army, units, roster, speciesKey)) return army;
  return { ...army, unitIds: [...army.unitIds, unitOutsideArmy(army, units, speciesKey).id] };
}

// rules.md 11.2 : retrait d'un individu d'une espèce, impossible pour le dernier de l'armée.
export function canRemoveFromArmy(army, units, speciesKey) {
  const members = armyUnits(army, units);
  return members.length > 1 && members.some((unit) => unit.species === speciesKey);
}

export function removeFromArmy(army, units, speciesKey) {
  if (!canRemoveFromArmy(army, units, speciesKey)) return army;
  const removed = armyUnits(army, units).find((unit) => unit.species === speciesKey);
  return { ...army, unitIds: army.unitIds.filter((id) => id !== removed.id) };
}

// rules.md 11.2 : nom de 1 à 20 caractères (comptés en caractères affichés, emojis compris),
// espaces de début et de fin retirés. Un nom vide ou fait d'espaces est refusé : l'ancien nom
// est conservé.
export function renameArmy(army, name) {
  const trimmed = name.trim();
  const length = [...trimmed].length;
  if (length === 0 || length > ARMY_NAME_MAX_LENGTH) return army;
  return { ...army, name: trimmed };
}
