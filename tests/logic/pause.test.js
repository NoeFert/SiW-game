import Grid from '../../src/logic/grid.js';
import Unit from '../../src/logic/unit.js';
import {
  createBattle, deployPlayerUnit, tickBattle, startDeploymentDrag, endDeploymentDrag, surrenderPlayer,
  startSurrenderConfirm, endSurrenderConfirm,
} from '../../src/logic/battle.js';
import { toggleMainPause, isBattleTimeRunning, PAUSE_DEFAULTS } from '../../src/logic/pause.js';
import { openCommandBar, cancelCommand, chooseOrder, selectUnit } from '../../src/logic/commandSelection.js';
import { canIssueCommand, getCooldownRemaining } from '../../src/logic/commands.js';

const PLAYER_ROSTER = {
  fighter: {
    name: 'Fighter', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 100, damage: 5, moveSpeed: 2, attackSpeed: 1, range: null, copies: 5,
  },
};

const ENEMY_ROSTER = {
  grunt: {
    name: 'Grunt', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 100, damage: 5, moveSpeed: 2, attackSpeed: 1, range: null, copies: 3,
  },
};

function newBattle(script = []) {
  return createBattle(new Grid(10, 10), PLAYER_ROSTER, ENEMY_ROSTER, script);
}

// Les trois façons de mettre la bataille en pause, pour vérifier chaque compteur sous chacune.
const PAUSES = {
  'pause principale': (battle) => toggleMainPause(battle.pause),
  'pause d\'interaction (drag de déploiement)': (battle) => startDeploymentDrag(battle),
  'pause d\'interaction (barre de commandes)': (battle) => openCommandBar(battle),
  'pause d\'interaction (confirmation d\'abandon)': (battle) => startSurrenderConfirm(battle),
};

describe.each(Object.entries(PAUSES))('gel de tous les compteurs — %s (rules.md 5.2)', (_, pause) => {
  test('le temps de bataille et le script de l\'IA ne progressent pas', () => {
    const battle = newBattle([{ time: 1, species: ENEMY_ROSTER.grunt }]);
    pause(battle);

    tickBattle(battle, 5);

    expect(battle.elapsedSeconds).toBe(0);
    expect(battle.units).toHaveLength(0); // le grunt prévu à t=1 n'est pas apparu
  });

  test('les mouvements et les timers d\'attaque sont gelés', () => {
    const battle = newBattle();
    const { unit: walker } = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 0);
    const { unit: fighter } = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 5);
    const farEnemy = new Unit(ENEMY_ROSTER.grunt, 'enemy', 9, 0);
    const closeEnemy = new Unit(ENEMY_ROSTER.grunt, 'enemy', 1, 5); // au contact de `fighter`
    battle.units.push(farEnemy, closeEnemy);
    tickBattle(battle, 0.5); // engagement lancé, timer d'attaque à mi-course
    const walkerX = walker.x;
    const timer = fighter.attackTimer;
    pause(battle);

    tickBattle(battle, 10);

    expect(walker.x).toBe(walkerX);
    expect(fighter.attackTimer).toBe(timer);
    expect(closeEnemy.hp).toBe(closeEnemy.species.maxHp);
  });

  test('le compte à rebours de 15 s est gelé', () => {
    const battle = newBattle([{ time: 0, species: ENEMY_ROSTER.grunt }]);
    tickBattle(battle, 1); // terrain du joueur vide, réserves pleines : compte à rebours lancé
    const countdown = battle.playerEndState.countdownRemaining;
    expect(countdown).not.toBeNull();
    pause(battle);

    tickBattle(battle, 30);

    expect(battle.playerEndState.countdownRemaining).toBe(countdown);
    expect(battle.outcome).toBe('ongoing');
  });
});

// La barre de commandes ne s'ouvre pas pendant le cooldown : seules les deux autres pauses
// peuvent coexister avec un cooldown en cours.
describe.each([
  ['pause principale', PAUSES['pause principale']],
  ['drag de déploiement', PAUSES["pause d'interaction (drag de déploiement)"]],
  ['confirmation d\'abandon', PAUSES["pause d'interaction (confirmation d'abandon)"]],
])('gel du cooldown des commandes — %s (rules.md 5.1)', (_, pause) => {
  test('le cooldown ne s\'écoule pas', () => {
    const battle = newBattle();
    battle.playerCommandState.lastCommandTime = 0; // commande donnée à t=0
    tickBattle(battle, 2);
    pause(battle);

    tickBattle(battle, 10);

    expect(getCooldownRemaining(battle.playerCommandState, battle.elapsedSeconds)).toBe(3);
  });
});

describe('combinaison des deux pauses (rules.md 5.2)', () => {
  test('le temps ne reprend que lorsque les deux pauses sont levées', () => {
    const battle = newBattle();
    toggleMainPause(battle.pause);
    openCommandBar(battle);

    cancelCommand(battle); // fin de l'interaction, la pause principale reste
    expect(isBattleTimeRunning(battle.pause)).toBe(false);
    tickBattle(battle, 1);
    expect(battle.elapsedSeconds).toBe(0);

    toggleMainPause(battle.pause);
    tickBattle(battle, 1);
    expect(battle.elapsedSeconds).toBe(1);
  });

  test('une interaction terminée relance le temps s\'il n\'y a pas de pause principale', () => {
    const battle = newBattle();
    startDeploymentDrag(battle);
    endDeploymentDrag(battle);

    tickBattle(battle, 1);

    expect(battle.elapsedSeconds).toBe(1);
  });
});

describe('actions pendant la pause principale (rules.md 5.2)', () => {
  test('plusieurs déploiements possibles, et le jeu reste en pause après', () => {
    const battle = newBattle();
    toggleMainPause(battle.pause);

    for (let y = 0; y < 3; y++) {
      expect(startDeploymentDrag(battle)).toBe(true);
      expect(deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, y).success).toBe(true);
      endDeploymentDrag(battle);
    }

    expect(battle.pause.main).toBe(true);
    expect(PAUSE_DEFAULTS.multipleDeploymentsPerMainPause).toBe(true);
  });

  test('une seule commande par pause principale : le cooldown gelé empêche la deuxième', () => {
    const battle = newBattle();
    const { unit } = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 0);
    toggleMainPause(battle.pause);

    openCommandBar(battle);
    chooseOrder(battle, 'flee');
    expect(selectUnit(battle, unit)).toBe(true);

    expect(battle.pause.main).toBe(true); // reste en pause après la commande
    expect(canIssueCommand(battle.playerCommandState, battle.elapsedSeconds)).toBe(false);
    expect(openCommandBar(battle)).toBe(false);
  });

  test('le déploiement reste limité par le budget de présence pendant la pause', () => {
    const battle = newBattle();
    battle.playerDeployment.bySpecies.get(PLAYER_ROSTER.fighter).freshRemaining = 20;
    toggleMainPause(battle.pause);
    for (let y = 0; y < 10; y++) deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, y);
    for (let y = 0; y < 5; y++) deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 1, y); // 150 points

    const result = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 2, 0);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('presenceCapExceeded');
  });
});

describe('abandon (rules.md 8.2)', () => {
  test('défaite immédiate, même en pause, sans exterminer les réserves', () => {
    const battle = newBattle();
    deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 0);
    toggleMainPause(battle.pause);

    surrenderPlayer(battle);

    expect(battle.outcome).toBe('enemyVictory');
    expect(battle.playerDeployment.bySpecies.get(PLAYER_ROSTER.fighter).freshRemaining).toBe(4);
  });
});

describe('confirmation d\'abandon (rules.md 5.2 / 8.2)', () => {
  test('renoncer à abandonner relance le temps, sauf pendant la pause principale', () => {
    const battle = newBattle();
    startSurrenderConfirm(battle);
    endSurrenderConfirm(battle);
    tickBattle(battle, 1);
    expect(battle.elapsedSeconds).toBe(1);

    toggleMainPause(battle.pause);
    startSurrenderConfirm(battle);
    endSurrenderConfirm(battle);
    expect(isBattleTimeRunning(battle.pause)).toBe(false);
  });

  test('ouvrir la confirmation annule la commande en cours, sans consommer le cooldown', () => {
    const battle = newBattle();
    openCommandBar(battle);

    startSurrenderConfirm(battle);
    endSurrenderConfirm(battle);

    expect(battle.commandSelection).toBeNull();
    expect(isBattleTimeRunning(battle.pause)).toBe(true);
    expect(canIssueCommand(battle.playerCommandState, battle.elapsedSeconds)).toBe(true);
  });
});
