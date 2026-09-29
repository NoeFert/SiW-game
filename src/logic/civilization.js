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
