import Grid from '../../src/logic/grid.js';
import Unit from '../../src/logic/unit.js';
import {
  createDeploymentState, deployUnit, recordReturn, isValidDeploymentPosition, countOwnedCopies,
  nearestValidDeploymentPosition,
  PRESENCE_CAP,
} from '../../src/logic/deployment.js';

// Roster fictif minimal, isolé de units.md, pour piloter précisément plafond/copies/légendaire.
const ROSTER = {
  grunt: {
    name: 'Grunt', keywords: [], attackType: 'melee', size: 1,
    cost: 50, maxHp: 20, damage: 1, moveSpeed: 1, attackSpeed: 1, range: null, copies: 5,
  },
  champion: {
    name: 'Champion', keywords: ['legendary'], attackType: 'melee', size: 2,
    cost: 60, maxHp: 50, damage: 5, moveSpeed: 1, attackSpeed: 1, range: null, copies: 2,
  },
  lonely: {
    name: 'Lonely', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 10, damage: 1, moveSpeed: 1, attackSpeed: 1, range: null, copies: 1,
  },
};

describe('deployUnit — plafond de points de présence (rules.md 2)', () => {
  test('accepte des déploiements tant que le total ne dépasse pas 150', () => {
    const state = createDeploymentState(ROSTER);
    const onField = [];

    for (let i = 0; i < 3; i++) { // 3 x 50 = 150, exactement le plafond
      const result = deployUnit(state, 'player', ROSTER.grunt, i, 0, onField);
      expect(result.success).toBe(true);
      onField.push(result.unit);
    }

    expect(onField.reduce((sum, u) => sum + u.species.cost, 0)).toBe(PRESENCE_CAP);
  });

  test('refuse un déploiement qui dépasserait le plafond', () => {
    const state = createDeploymentState(ROSTER);
    const onField = [];
    for (let i = 0; i < 3; i++) {
      onField.push(deployUnit(state, 'player', ROSTER.grunt, i, 0, onField).unit);
    }

    const result = deployUnit(state, 'player', ROSTER.grunt, 9, 0, onField); // 200 > 150

    expect(result.success).toBe(false);
    expect(result.reason).toBe('presenceCapExceeded');
  });

  test('les points se libèrent dès qu\'une unité meurt ou fuit (le plafond est vivant)', () => {
    const state = createDeploymentState(ROSTER);
    let onField = [];
    for (let i = 0; i < 3; i++) {
      onField.push(deployUnit(state, 'player', ROSTER.grunt, i, 0, onField).unit);
    }
    expect(deployUnit(state, 'player', ROSTER.grunt, 9, 0, onField).success).toBe(false);

    onField = onField.slice(1); // une unité retirée (morte ou en fuite, peu importe pour le plafond)

    const result = deployUnit(state, 'player', ROSTER.grunt, 9, 0, onField);
    expect(result.success).toBe(true);
  });
});

describe('deployUnit — copies et fuite (rules.md 2)', () => {
  test('épuise les copies disponibles d\'une espèce', () => {
    const state = createDeploymentState(ROSTER);
    expect(deployUnit(state, 'player', ROSTER.lonely, 0, 0, []).success).toBe(true);

    const result = deployUnit(state, 'player', ROSTER.lonely, 1, 0, []);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('noCopiesLeft');
  });

  test('redéploie une copie revenue de fuite avec ses PV réduits conservés', () => {
    const state = createDeploymentState(ROSTER);
    const { unit } = deployUnit(state, 'player', ROSTER.lonely, 0, 0, []);
    unit.hp = 3; // dégâts subis avant la fuite

    recordReturn(state, unit);
    const result = deployUnit(state, 'player', ROSTER.lonely, 5, 5, []);

    expect(result.success).toBe(true);
    expect(result.unit.hp).toBe(3); // pas species.maxHp (10)
  });
});

describe('deployUnit — choix explicite de la copie (sidebar : lignes séparées par variante)', () => {
  function stateWithOneWoundedGrunt() {
    const state = createDeploymentState(ROSTER);
    const { unit } = deployUnit(state, 'player', ROSTER.grunt, 0, 0, []);
    unit.hp = 7; // dégâts subis avant la fuite
    recordReturn(state, unit);
    return state;
  }

  test('copyChoice "fresh" garantit une copie à PV max même si une copie blessée existe', () => {
    const state = stateWithOneWoundedGrunt();

    const result = deployUnit(state, 'player', ROSTER.grunt, 1, 0, [], 'fresh');

    expect(result.success).toBe(true);
    expect(result.unit.hp).toBe(ROSTER.grunt.maxHp);
    expect(state.bySpecies.get(ROSTER.grunt).returning).toEqual([{ hp: 7 }]); // pas consommée
  });

  test('copyChoice = PV précis déploie exactement la copie revenue de fuite correspondante', () => {
    const state = stateWithOneWoundedGrunt();

    const result = deployUnit(state, 'player', ROSTER.grunt, 1, 0, [], 7);

    expect(result.success).toBe(true);
    expect(result.unit.hp).toBe(7);
    expect(state.bySpecies.get(ROSTER.grunt).returning).toHaveLength(0);
  });

  test('copyChoice "fresh" est refusé s\'il ne reste aucune copie fraîche, sans repli automatique', () => {
    const state = createDeploymentState(ROSTER);
    state.bySpecies.get(ROSTER.grunt).freshRemaining = 0;
    const wounded = new Unit(ROSTER.grunt, 'player', 0, 0);
    wounded.hp = 5;
    recordReturn(state, wounded);

    const result = deployUnit(state, 'player', ROSTER.grunt, 1, 0, [], 'fresh');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('noCopiesLeft');
  });

  test('copyChoice avec des PV qui ne correspondent à aucune copie en réserve est refusé', () => {
    const state = stateWithOneWoundedGrunt(); // une seule copie revenue, à 7 PV

    const result = deployUnit(state, 'player', ROSTER.grunt, 1, 0, [], 12);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('noCopiesLeft');
  });

  test('sans copyChoice, le comportement historique (revenue de fuite en priorité) est inchangé', () => {
    const state = stateWithOneWoundedGrunt();

    const result = deployUnit(state, 'player', ROSTER.grunt, 1, 0, []);

    expect(result.unit.hp).toBe(7);
  });
});

describe('deployUnit — limite du [Légendaire] (rules.md 2)', () => {
  test('bloque un second exemplaire simultané, indépendamment du budget disponible', () => {
    const state = createDeploymentState(ROSTER);
    const first = deployUnit(state, 'player', ROSTER.champion, 0, 0, []);
    expect(first.success).toBe(true);

    const result = deployUnit(state, 'player', ROSTER.champion, 5, 5, [first.unit]);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('legendaryAlreadyDeployed');
  });

  test('une tentative refusée ne consomme pas de copie', () => {
    const state = createDeploymentState(ROSTER);
    const first = deployUnit(state, 'player', ROSTER.champion, 0, 0, []);
    deployUnit(state, 'player', ROSTER.champion, 5, 5, [first.unit]); // refusé

    expect(state.bySpecies.get(ROSTER.champion).freshRemaining).toBe(1); // 2 - 1 (seul le succès compte)
  });

  test('redevient déployable une fois le premier exemplaire retiré du terrain', () => {
    const state = createDeploymentState(ROSTER);
    deployUnit(state, 'player', ROSTER.champion, 0, 0, []);

    const result = deployUnit(state, 'player', ROSTER.champion, 5, 5, []); // plus personne sur le terrain

    expect(result.success).toBe(true);
  });
});

describe('deployUnit — signal de pause tactique (rules.md 2)', () => {
  test('un déploiement réussi signale une pause ; le vrai contrôle du temps viendra de Phaser', () => {
    const state = createDeploymentState(ROSTER);
    const result = deployUnit(state, 'player', ROSTER.grunt, 0, 0, []);
    expect(result.timeControl).toBe('pause');
  });
});

describe('isValidDeploymentPosition (rules.md 1/2)', () => {
  const grid = new Grid(10, 6, [{ x: 2, y: 2 }]); // moitié joueur : x 0-4, moitié IA : x 5-9

  test('accepte une case libre dans la moitié du camp', () => {
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 3, 3, [])).toBe(true);
  });

  test('refuse une case dans la moitié adverse', () => {
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 6, 3, [])).toBe(false);
    expect(isValidDeploymentPosition(grid, 'enemy', ROSTER.grunt, 3, 3, [])).toBe(false);
  });

  test('refuse une case occupée par un obstacle', () => {
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 2, 2, [])).toBe(false);
  });

  test('refuse une case déjà occupée par une autre unité', () => {
    const occupant = new Unit(ROSTER.grunt, 'player', 1, 1);
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 1, 1, [occupant])).toBe(false);
  });

  test('un bloc 2x2 doit tenir entièrement dans la moitié du camp', () => {
    // champion (taille 2) à x=4 déborderait sur la moitié adverse (4+2=6 > halfWidth=5)
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.champion, 4, 0, [])).toBe(false);
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.champion, 3, 0, [])).toBe(true);
  });
});

describe('countOwnedCopies — copies possédées après bataille (rules.md 2, technical.md 5.4)', () => {
  test('une copie tuée est perdue, une copie en fuite ou encore sur le terrain reste possédée', () => {
    const state = createDeploymentState(ROSTER);
    const killed = deployUnit(state, 'player', ROSTER.grunt, 0, 0, []).unit;
    const fled = deployUnit(state, 'player', ROSTER.grunt, 1, 0, []).unit;
    const standing = deployUnit(state, 'player', ROSTER.grunt, 2, 0, []).unit;

    killed.hp = 0;
    fled.hasFled = true;
    recordReturn(state, fled);

    const onField = [killed, fled, standing].filter((u) => u.isOnField);
    expect(countOwnedCopies(ROSTER, state, 'player', onField)).toEqual({ grunt: 4, champion: 2, lonely: 1 });
  });

  test('ignore les unités du camp adverse de même espèce', () => {
    const state = createDeploymentState(ROSTER);
    const enemy = new Unit(ROSTER.lonely, 'enemy', 0, 0);
    expect(countOwnedCopies(ROSTER, state, 'player', [enemy]).lonely).toBe(1);
  });
});

describe('nearestValidDeploymentPosition — case du script IA occupée (rules.md 1/7)', () => {
  test('renvoie la case demandée si elle est libre', () => {
    const grid = new Grid(10, 10);
    expect(nearestValidDeploymentPosition(grid, 'enemy', ROSTER.grunt, 6, 5, [])).toEqual({ x: 6, y: 5 });
  });

  test('bloc 2x2 : décale vers la case la plus proche où les 4 cases sont libres, dans la moitié IA', () => {
    const grid = new Grid(10, 10);
    const blocker = new Unit(ROSTER.grunt, 'player', 7, 6); // chevauche le bloc (6,5)-(7,6)
    const position = nearestValidDeploymentPosition(grid, 'enemy', ROSTER.champion, 6, 5, [blocker]);

    expect(position).not.toBeNull();
    expect(Math.max(Math.abs(position.x - 6), Math.abs(position.y - 5))).toBe(1);
    expect(isValidDeploymentPosition(grid, 'enemy', ROSTER.champion, position.x, position.y, [blocker])).toBe(true);
  });
});
