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

// rules.md 11.2 : le joueur coche un individu précis pour l'ajouter. Impossible s'il n'est pas
// possédé, s'il est déjà dans l'armée, ou si le coût dépasserait 500 (le coût est celui de
// l'espèce, quel que soit le niveau).
export function canAddToArmy(army, units, roster, unitId) {
  const unit = units.find((u) => u.id === unitId);
  return unit !== undefined && !army.unitIds.includes(unitId)
    && armyCost(army, units, roster) + roster[unit.species].cost <= ARMY_PP_CAP;
}

export function addToArmy(army, units, roster, unitId) {
  if (!canAddToArmy(army, units, roster, unitId)) return army;
  return { ...army, unitIds: [...army.unitIds, unitId] };
}

// rules.md 11.2 : retrait d'un individu précis, impossible pour le dernier de l'armée.
export function canRemoveFromArmy(army, units, unitId) {
  const members = armyUnits(army, units);
  return members.length > 1 && members.some((unit) => unit.id === unitId);
}

export function removeFromArmy(army, units, unitId) {
  if (!canRemoveFromArmy(army, units, unitId)) return army;
  return { ...army, unitIds: army.unitIds.filter((id) => id !== unitId) };
}

// rules.md 11.2 : un individu mort est retiré de l'armée en même temps que de la liste.
export function removeDeadFromArmy(army, units) {
  const owned = new Set(units.map((unit) => unit.id));
  return { ...army, unitIds: army.unitIds.filter((id) => owned.has(id)) };
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
