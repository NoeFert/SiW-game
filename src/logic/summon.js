// Couche méta du jeu normal (rules.md 11.3 et 11.4) : Spirit Stones et invocation. Logique pure,
// sans Phaser ni localStorage (la sauvegarde vit dans persistence.js).
import { createUnit } from './ownedUnits.js';

// rules.md 10 : somme de départ en Spirit Stones, donnée au choix de la faction. Provisoire (0)
// tant que l'économie n'est pas chiffrée (second passage de roadmap-mvp.md).
export const STARTING_SPIRIT_STONES = 0;

// rules.md 10 / 11.4 : prix d'invocation = coût en PP × k, × un multiplicateur pour le
// [Légendaire]. Valeurs provisoires (k = 1, pas de multiplicateur) jusqu'au second passage de
// roadmap-mvp.md.
export const SUMMON_PRICE_FACTOR = 1;
export const LEGENDARY_PRICE_MULTIPLIER = 1;

// rules.md 11.4 : action d'invocation d'une espèce, selon le nombre d'individus possédés —
// 'summon' (Invoquer), 'resummon' (Réinvoquer : [Légendaire] mort) ou 'alreadyOwned'
// ([Légendaire] vivant, « Déjà à vos côtés »).
export function summonAction(species, ownedCount) {
  if (!species.keywords.includes('legendary')) return 'summon';
  return ownedCount > 0 ? 'alreadyOwned' : 'resummon';
}

export function summonPrice(species) {
  const multiplier = species.keywords.includes('legendary') ? LEGENDARY_PRICE_MULTIPLIER : 1;
  return species.cost * SUMMON_PRICE_FACTOR * multiplier;
}

// rules.md 11.4 : impossible pour un [Légendaire] vivant ou si le solde est insuffisant.
export function canSummon(species, ownedCount, spiritStones) {
  return summonAction(species, ownedCount) !== 'alreadyOwned' && spiritStones >= summonPrice(species);
}

// rules.md 11.4 : invoquer = payer le prix et ajouter un nouvel individu à la liste (pas à
// l'armée). Renvoie la nouvelle liste et le nouveau solde, ou `null` si c'est impossible.
export function summon(roster, units, spiritStones, speciesKey) {
  const species = roster[speciesKey];
  const owned = units.filter((unit) => unit.species === speciesKey).length;
  if (!canSummon(species, owned, spiritStones)) return null;
  return { units: [...units, createUnit(speciesKey)], spiritStones: spiritStones - summonPrice(species) };
}
