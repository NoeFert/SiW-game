// Couche méta du jeu normal (rules.md 11.1) : individus possédés par le joueur. Logique pure,
// sans Phaser ni localStorage (la sauvegarde vit dans persistence.js).

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
