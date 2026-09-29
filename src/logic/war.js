// Couche méta du jeu normal (rules.md 11.7) : « Partir en guerre ». Logique pure, sans Phaser ni
// localStorage (la sauvegarde vit dans persistence.js).
import { removeDeadFromArmy } from './army.js';
import { applyVictoryToUnits, individualXpGains } from './levels.js';
import { summonPrice } from './summon.js';

// rules.md 11.7 : au rejeu, 25 % de la récompense de la première victoire (provisoire).
export const REPLAY_REWARD_PERCENT = 25;

// rules.md 11.7 : 'won' (déjà gagnée), 'available' (première, ou précédente gagnée) ou 'locked'.
// `battleIds` : les batailles dans l'ordre de déblocage ; `wonIds` : celles déjà gagnées.
export function warBattleState(battleIds, wonIds, battleId) {
  if (wonIds.includes(battleId)) return 'won';
  const index = battleIds.indexOf(battleId);
  return index === 0 || wonIds.includes(battleIds[index - 1]) ? 'available' : 'locked';
}

export function isWarCompleted(battleIds, wonIds) {
  return battleIds.every((id) => wonIds.includes(id));
}

// rules.md 11.7 : Spirit Stones d'une victoire — pleine la première fois, 25 % au rejeu (arrondi
// à l'entier inférieur).
export function victoryReward(fullReward, alreadyWon) {
  return alreadyWon ? Math.floor((fullReward * REPLAY_REWARD_PERCENT) / 100) : fullReward;
}

// Unités perdues par espèce, dans l'ordre du roster, au format du bilan des pertes
// (technical.md 5.6) : [{ species, lost }], espèces sans perte omises.
export function lossReport(roster, units, dead) {
  return Object.entries(roster)
    .map(([key, species]) => ({
      species,
      lost: units.filter((unit) => unit.species === key && dead.has(unit.id)).length,
    }))
    .filter((row) => row.lost > 0);
}

// rules.md 11.7 : défaite, abandon ou match nul d'une bataille de « Partir en guerre » — les
// individus tués sont perdus quand même (retirés de la liste et de l'armée), le niveau du
// [Légendaire] mort est mémorisé (11.4) ; aucune XP, aucune récompense.
// `save` : { units, army, fallenLegendaryLevel }. Renvoie la nouvelle sauvegarde et le bilan.
export function resolveWarDefeat(save, battleUnits, roster) {
  const { dead } = individualXpGains(battleUnits);
  const units = applyVictoryToUnits(save.units, { gains: new Map(), dead });
  let { fallenLegendaryLevel } = save;
  for (const [id, level] of dead) {
    const unit = save.units.find((u) => u.id === id);
    if (unit && roster[unit.species].keywords.includes('legendary')) fallenLegendaryLevel = level;
  }
  return {
    save: { units, army: removeDeadFromArmy(save.army, units), fallenLegendaryLevel },
    lost: lossReport(roster, save.units, dead),
  };
}

// rules.md 11.7 : filet de sécurité — sans aucun individu et avec un solde inférieur au prix de
// l'unité basique (sans keyword), le solde est porté à ce prix. Renvoie le solde à appliquer.
export function safetyNetSpiritStones(roster, units, spiritStones) {
  const basic = Object.values(roster).find((species) => species.keywords.length === 0);
  if (units.length > 0) return spiritStones;
  return Math.max(spiritStones, summonPrice(basic));
}
