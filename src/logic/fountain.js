// Couche méta du jeu normal (rules.md 11.8) : Spirit Fountain de l'accueil. Logique pure — le
// temps est passé en paramètre (horodatages en millisecondes), la sauvegarde vit dans
// persistence.js.

// rules.md 11.8 : 1 Spirit Stone par minute entière, capacité 20 + 10 × niveau (provisoires).
export const FOUNTAIN_MINUTE_MS = 60 * 1000;
export const FOUNTAIN_BASE_CAPACITY = 20;
export const FOUNTAIN_CAPACITY_PER_LEVEL = 10;

export function fountainCapacity(playerLevel) {
  return FOUNTAIN_BASE_CAPACITY + FOUNTAIN_CAPACITY_PER_LEVEL * playerLevel;
}

// Contenu : minutes entières écoulées depuis la dernière récolte, plafonné à la capacité, jamais
// négatif (horloge reculée).
export function fountainContent(lastHarvestMs, nowMs, capacity) {
  const minutes = Math.floor((nowMs - lastHarvestMs) / FOUNTAIN_MINUTE_MS);
  return Math.min(capacity, Math.max(0, minutes));
}

// rules.md 11.8 : récolte tout le contenu. La minute entamée est conservée (l'heure de référence
// n'avance que des minutes récoltées) ; si la fontaine était pleine, le surplus est perdu et la
// production repart de maintenant. Renvoie { collected, lastHarvestMs }.
export function harvestFountain(lastHarvestMs, nowMs, capacity) {
  const collected = fountainContent(lastHarvestMs, nowMs, capacity);
  if (collected === 0) return { collected, lastHarvestMs };
  return {
    collected,
    lastHarvestMs: collected === capacity ? nowMs : lastHarvestMs + collected * FOUNTAIN_MINUTE_MS,
  };
}
