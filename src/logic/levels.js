// Couche méta du jeu normal (rules.md 11.5 et 11.6) : niveaux du joueur et des individus.
// Logique pure, sans Phaser ni localStorage (la sauvegarde vit dans persistence.js).

// --- Individus (rules.md 11.6) ---

export const INDIVIDUAL_MAX_LEVEL = 5;
export const SURVIVAL_XP = 10;

// XP cumulée pour atteindre `level` : passer de N à N + 1 demande 50 × N (0, 50, 150, 300, 500).
export function individualXpForLevel(level) {
  return 25 * (level - 1) * level;
}

export const INDIVIDUAL_MAX_XP = individualXpForLevel(INDIVIDUAL_MAX_LEVEL);

export function individualLevel(xp) {
  let level = 1;
  while (level < INDIVIDUAL_MAX_LEVEL && xp >= individualXpForLevel(level + 1)) level += 1;
  return level;
}

// Barre d'XP : progression dans le niveau en cours (`isMax` au niveau 5, affiché « MAX »).
export function individualProgress(xp) {
  const level = individualLevel(xp);
  const isMax = level === INDIVIDUAL_MAX_LEVEL;
  const start = individualXpForLevel(level);
  return {
    level,
    isMax,
    xpInLevel: isMax ? 0 : xp - start,
    xpForLevel: isMax ? 0 : individualXpForLevel(level + 1) - start,
  };
}

// rules.md 11.6 : +10 % par niveau au-dessus du 1, arrondi au plus proche (0,5 au-dessus),
// calculé en entiers — base × (9 + niveau) / 10 — pour éviter les erreurs de virgule.
export function levelStat(base, level) {
  return Math.floor((base * (9 + level) + 5) / 10);
}

// Dégâts d'une espèce au niveau donné ; une attaque hybride ({ ranged, melee }) augmente les deux.
export function levelDamage(damage, level) {
  if (typeof damage === 'number') return levelStat(damage, level);
  return { ranged: levelStat(damage.ranged, level), melee: levelStat(damage.melee, level) };
}

// rules.md 11.6 : XP gagnée par chaque individu du joueur à la victoire, à partir des unités de
// la bataille (`battle.units` : une instance par déploiement, qui reste dans la liste après une
// mort ou une fuite). Un individu déployé et vivant à la fin gagne 10 + le coût des ennemis
// qu'il a achevés (`killXp`, cumulé sur tous ses déploiements) ; un individu mort ne gagne rien.
// Renvoie aussi les individus morts et leur niveau (mémoire du [Légendaire], rules.md 11.4).
export function individualXpGains(battleUnits) {
  const deployed = battleUnits.filter((u) => u.faction === 'player' && u.individualId);
  const dead = new Map(); // individualId -> niveau à la mort
  for (const unit of deployed) if (!unit.isAlive) dead.set(unit.individualId, unit.level);

  const gains = new Map();
  for (const unit of deployed) {
    if (dead.has(unit.individualId)) continue;
    const previous = gains.get(unit.individualId) ?? SURVIVAL_XP;
    gains.set(unit.individualId, previous + unit.killXp);
  }
  return { gains, dead };
}

// Applique les gains aux individus possédés (XP plafonnée à 500) et retire les morts.
export function applyVictoryToUnits(units, { gains, dead }) {
  return units
    .filter((unit) => !dead.has(unit.id))
    .map((unit) => (gains.has(unit.id)
      ? { ...unit, xp: Math.min(INDIVIDUAL_MAX_XP, unit.xp + gains.get(unit.id)) }
      : unit));
}

// technical.md 5.3 : individus qui ont gagné au moins un niveau, regroupés par espèce et par
// passage de niveau (« 2x Ver de Lambton niv 1 → 2 »), dans l'ordre de `before`.
export function levelUps(before, after) {
  const afterById = new Map(after.map((unit) => [unit.id, unit]));
  const groups = new Map();
  for (const unit of before) {
    const updated = afterById.get(unit.id);
    if (!updated) continue;
    const from = individualLevel(unit.xp);
    const to = individualLevel(updated.xp);
    if (to === from) continue;
    const key = `${unit.species}-${from}-${to}`;
    const group = groups.get(key) ?? { species: unit.species, from, to, count: 0 };
    group.count += 1;
    groups.set(key, group);
  }
  return [...groups.values()];
}

// Tri d'affichage des individus d'une espèce (technical.md 5.1) : niveau puis XP décroissants.
export function sortByLevel(units) {
  return [...units].sort((a, b) => b.xp - a.xp);
}

// --- Joueur (rules.md 11.5) ---

export const FIRST_BATTLE_PLAYER_XP = 100;
export const VICTORY_PLAYER_XP = 100;
export const SURVIVORS_BONUS_XP = 100;

// XP cumulée pour atteindre `level` : passer de N à N + 1 demande 500 × N (0, 500, 1 500...).
export function playerXpForLevel(level) {
  return 250 * (level - 1) * level;
}

export function playerLevel(xp) {
  let level = 1;
  while (xp >= playerXpForLevel(level + 1)) level += 1;
  return level;
}

export function playerProgress(xp) {
  const level = playerLevel(xp);
  const start = playerXpForLevel(level);
  return { level, xpInLevel: xp - start, xpForLevel: playerXpForLevel(level + 1) - start };
}

// rules.md 11.5 : victoire d'une bataille de « Partir en guerre » — 100 + 100 × (PP des
// survivants / PP de l'armée emmenée), arrondi à l'entier inférieur.
export function victoryPlayerXp(armyCost, survivorsCost) {
  return VICTORY_PLAYER_XP + Math.floor((SURVIVORS_BONUS_XP * survivorsCost) / armyCost);
}

// rules.md 11.5 : chaque niveau atteint rapporte 50 × le nouveau niveau en Spirit Stones
// (provisoire, rules.md 10) ; tous les niveaux franchis d'un coup sont récompensés.
export const LEVEL_REWARD_FACTOR = 50;

export function playerLevelReward(xpBefore, xpAfter) {
  let reward = 0;
  for (let level = playerLevel(xpBefore) + 1; level <= playerLevel(xpAfter); level += 1) {
    reward += LEVEL_REWARD_FACTOR * level;
  }
  return reward;
}
