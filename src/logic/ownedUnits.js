// Couche méta du jeu normal (rules.md 11.1) : individus possédés par le joueur. Logique pure,
// sans Phaser ni localStorage (la sauvegarde vit dans persistence.js).

// rules.md 11.1 : un individu a un identifiant, une espèce (clé de roster) et une XP (11.6 ;
// le niveau s'en déduit, voir levels.js). L'identifiant vient de crypto.randomUUID(), jamais de
// la taille de la liste (technical.md 5.4).
export function createUnit(species, xp = 0) {
  return { id: crypto.randomUUID(), species, xp };
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
