// Couche méta du jeu normal (rules.md 11.2) : l'armée du joueur. Logique pure, sans Phaser ni
// localStorage (la sauvegarde vit dans persistence.js).

// rules.md 11.2 : plafond de coût d'une armée, en points de présence (distinct des 150 du terrain).
export const ARMY_PP_CAP = 500;
export const ARMY_NAME_MAX_LENGTH = 20;

// rules.md 11.2 : une armée est un nom et une liste d'identifiants d'individus.
export function createArmy(name, units) {
  return { name, unitIds: units.map((unit) => unit.id) };
}

// Individus possédés présents dans l'armée (rules.md 11.2).
export function armyUnits(army, units) {
  const ids = new Set(army?.unitIds ?? []);
  return units.filter((unit) => ids.has(unit.id));
}

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
