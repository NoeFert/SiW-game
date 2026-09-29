// Couche méta du jeu normal : ce que change une victoire (rules.md 11). Logique pure — App.jsx
// lit la sauvegarde, appelle resolveVictory, puis sauvegarde le résultat.
import { armyCost, createArmy, removeDeadFromArmy } from './army.js';
import {
  FIRST_BATTLE_PLAYER_XP, applyVictoryToUnits, individualXpGains, levelUps, playerLevelReward,
  victoryPlayerXp,
} from './levels.js';

// `save` : { units, army, playerXp, spiritStones, fallenLegendaryLevel } avant la bataille.
// `battleUnits` : toutes les unités de la bataille (battle.units).
// `firstBattle` : bataille 01 — XP du joueur fixe, et armée de départ créée avec tous les
// survivants (`armyName`) ; sinon, bonus selon les PP survivants de l'armée, morts retirés de
// l'armée. `reward` : Spirit Stones de la victoire (rules.md 11.7, déjà réduite au rejeu).
// Renvoie la nouvelle sauvegarde et le bilan affiché sur l'écran de victoire (technical.md 5.3).
export function resolveVictory(save, battleUnits, roster, { firstBattle, armyName, reward = 0 }) {
  const xpGains = individualXpGains(battleUnits);
  // rules.md 11.1 / 11.6 : morts retirés, XP des survivants déployés.
  const units = applyVictoryToUnits(save.units, xpGains);

  // rules.md 11.4 : niveau du [Légendaire] à sa mort, écrasé à chaque nouvelle mort.
  let { fallenLegendaryLevel } = save;
  for (const [id, level] of xpGains.dead) {
    const unit = save.units.find((u) => u.id === id);
    if (unit && roster[unit.species].keywords.includes('legendary')) fallenLegendaryLevel = level;
  }

  // rules.md 11.5 : XP du joueur (100 fixes pour la bataille 01).
  const xpGained = firstBattle
    ? FIRST_BATTLE_PLAYER_XP
    : victoryPlayerXp(armyCost(save.army, save.units, roster), armyCost(save.army, units, roster));
  const playerXp = save.playerXp + xpGained;

  // rules.md 11.2 : armée de départ avec tous les survivants, sinon morts retirés de l'armée.
  const army = firstBattle ? createArmy(armyName, units) : removeDeadFromArmy(save.army, units);

  return {
    save: {
      units,
      army,
      playerXp,
      spiritStones: save.spiritStones + reward + playerLevelReward(save.playerXp, playerXp),
      fallenLegendaryLevel,
    },
    report: { xpGained, spiritStonesGained: reward, levelUps: levelUps(save.units, units) },
  };
}
