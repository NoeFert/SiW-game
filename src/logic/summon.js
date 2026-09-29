// Couche méta du jeu normal (rules.md 11.3 et 11.4) : Spirit Stones et invocation. Logique pure,
// sans Phaser ni localStorage (la sauvegarde vit dans persistence.js).
import { createUnit } from './ownedUnits.js';
import { individualXpForLevel } from './levels.js';

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

// rules.md 11.4 : prix de réinvocation du [Légendaire] au niveau gardé — +25 % du prix de base
// par niveau au-delà du 1, arrondi à l'entier inférieur (calcul en entiers : base × (3 + niveau) / 4).
export function resummonPrice(species, level) {
  return Math.floor((summonPrice(species) * (3 + level)) / 4);
}

// rules.md 11.4 : impossible pour un [Légendaire] vivant, pour un niveau gardé hors de 1 à
// `maxLevel` (niveau du [Légendaire] à sa mort), ou si le solde est insuffisant.
export function canSummon(species, ownedCount, spiritStones, level = 1, maxLevel = 1) {
  const action = summonAction(species, ownedCount);
  if (action === 'alreadyOwned') return false;
  if (level !== 1 && (action !== 'resummon' || level < 1 || level > maxLevel)) return false;
  return spiritStones >= resummonPrice(species, level);
}

// rules.md 11.4 : invoquer = payer le prix et ajouter un nouvel individu à la liste (pas à
// l'armée), niveau 1 — ou, pour un [Légendaire] réinvoqué, au niveau gardé choisi (XP du début
// de ce niveau). `fallenLevel` : niveau du [Légendaire] à sa mort (1 s'il n'est jamais mort).
// Renvoie la nouvelle liste et le nouveau solde, ou `null` si c'est impossible.
export function summon(roster, units, spiritStones, speciesKey, level = 1, fallenLevel = 1) {
  const species = roster[speciesKey];
  const owned = units.filter((unit) => unit.species === speciesKey).length;
  if (!canSummon(species, owned, spiritStones, level, fallenLevel)) return null;
  return {
    units: [...units, createUnit(speciesKey, individualXpForLevel(level))],
    spiritStones: spiritStones - resummonPrice(species, level),
  };
}
