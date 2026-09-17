// battle.js n'implémente pas de règle nouvelle — c'est le fil qui relie les modules déjà
// testés (déploiement, commandes, combat, fin de bataille). Ce fichier n'a donc pas été
// demandé explicitement, mais un smoke test reste utile pour attraper une erreur de câblage
// (CLAUDE.md : toute logique de jeu doit avoir un test associé).
import Grid from '../../src/logic/grid.js';
import {
  createBattle, deployPlayerUnit, issuePlayerFlee, tickBattle,
} from '../../src/logic/battle.js';

const PLAYER_ROSTER = {
  fighter: {
    name: 'Fighter', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 100, damage: 50, moveSpeed: 5, attackSpeed: 0.1, range: null, copies: 3,
  },
};

const ENEMY_ROSTER = {
  grunt: {
    name: 'Grunt', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 10, damage: 1, moveSpeed: 1, attackSpeed: 1, range: null, copies: 1,
  },
};

const ENEMY_SCRIPT = [{ time: 0, species: ENEMY_ROSTER.grunt, x: 5, y: 5 }];

describe('battle.js — câblage déploiement/combat/fin de bataille', () => {
  test('deployPlayerUnit ajoute l\'unité à la bataille et signale la pause', () => {
    const battle = createBattle(new Grid(10, 10), PLAYER_ROSTER, ENEMY_ROSTER, ENEMY_SCRIPT);

    const result = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 4, 5);

    expect(result.success).toBe(true);
    expect(result.timeControl).toBe('pause');
    expect(battle.units).toContain(result.unit);
  });

  test('une bataille minimale se termine par une victoire du joueur une fois l\'IA éliminée', () => {
    const battle = createBattle(new Grid(10, 10), PLAYER_ROSTER, ENEMY_ROSTER, ENEMY_SCRIPT);
    deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 4, 5);

    let outcome = 'ongoing';
    for (let t = 0; t < 10 && outcome === 'ongoing'; t++) {
      outcome = tickBattle(battle, 1);
    }

    expect(outcome).toBe('playerVictory');
    expect(tickBattle(battle, 1)).toBe('playerVictory'); // reste figé une fois tranchée
  });

  test('deployPlayerUnit refuse une position hors de la moitié du joueur (rules.md 2)', () => {
    const battle = createBattle(new Grid(10, 10), PLAYER_ROSTER, ENEMY_ROSTER, ENEMY_SCRIPT);

    const result = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 7, 5); // moitié IA (x >= 5)

    expect(result.success).toBe(false);
    expect(result.reason).toBe('invalidPosition');
  });

  test('issuePlayerFlee passe par le cooldown de battle.playerCommandState', () => {
    const battle = createBattle(new Grid(10, 10), PLAYER_ROSTER, ENEMY_ROSTER, ENEMY_SCRIPT);
    const { unit } = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 0);

    expect(issuePlayerFlee(battle, unit)).toBe(true);
    expect(unit.command).toEqual({ type: 'flee' });
  });
});
