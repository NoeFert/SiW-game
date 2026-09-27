import Grid from '../../src/logic/grid.js';
import Unit from '../../src/logic/unit.js';
import { createBattle, deployPlayerUnit, tickBattle, startDeploymentDrag } from '../../src/logic/battle.js';
import {
  openCommandBar, cancelCommand, chooseOrder, selectUnit, selectEnemy, selectCell, clickField,
  getClickableHighlights,
} from '../../src/logic/commandSelection.js';
import { canIssueCommand } from '../../src/logic/commands.js';

const ROSTER = {
  fighter: {
    name: 'Fighter', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 100, damage: 5, moveSpeed: 2, attackSpeed: 1, range: null, copies: 5,
  },
};

// Bataille avec une unité du joueur en (1, 1) et un ennemi en (8, 8).
function setup() {
  const battle = createBattle(new Grid(10, 10), ROSTER, ROSTER, []);
  const { unit } = deployPlayerUnit(battle, ROSTER.fighter, 1, 1);
  const enemy = new Unit(ROSTER.fighter, 'enemy', 8, 8);
  battle.units.push(enemy);
  return { battle, unit, enemy };
}

describe('ouverture de la barre de commandes (rules.md 5)', () => {
  test('met le jeu en pause dès l\'ouverture, avant tout choix', () => {
    const { battle } = setup();

    expect(openCommandBar(battle)).toBe(true);

    expect(battle.pause.interaction).toBe('command');
    tickBattle(battle, 1);
    expect(battle.elapsedSeconds).toBe(0);
  });

  test('ne s\'ouvre pas pendant le cooldown', () => {
    const { battle, unit } = setup();
    openCommandBar(battle);
    chooseOrder(battle, 'flee');
    selectUnit(battle, unit);
    tickBattle(battle, 4.9);

    expect(openCommandBar(battle)).toBe(false);

    tickBattle(battle, 0.1);
    expect(openCommandBar(battle)).toBe(true);
  });

  test('ne s\'ouvre pas pendant un drag de déploiement, et inversement', () => {
    const { battle } = setup();
    startDeploymentDrag(battle);
    expect(openCommandBar(battle)).toBe(false);

    const other = setup().battle;
    openCommandBar(other);
    expect(startDeploymentDrag(other)).toBe(false);
  });
});

describe('voie 1 — ordre, unité, cible (rules.md 5)', () => {
  test('attack : ordre, unité, puis ennemi', () => {
    const { battle, unit, enemy } = setup();
    openCommandBar(battle);
    chooseOrder(battle, 'attack');
    selectUnit(battle, unit);

    expect(selectEnemy(battle, enemy)).toBe(true);

    expect(unit.command).toEqual({ type: 'attack', target: enemy });
    expect(battle.commandSelection).toBeNull();
    expect(battle.pause.interaction).toBeNull();
  });

  test('move : ordre, unité, puis case', () => {
    const { battle, unit } = setup();
    openCommandBar(battle);
    chooseOrder(battle, 'move');
    selectUnit(battle, unit);

    expect(selectCell(battle, 4, 4)).toBe(true);

    expect(unit.command).toEqual({ type: 'moveTo', x: 4, y: 4 });
  });

  test('flee : émis dès la sélection de l\'unité, sans cible', () => {
    const { battle, unit } = setup();
    openCommandBar(battle);
    chooseOrder(battle, 'flee');

    expect(selectUnit(battle, unit)).toBe(true);

    expect(unit.command).toEqual({ type: 'flee' });
    expect(battle.commandSelection).toBeNull();
  });

  test('une cible incompatible avec l\'ordre est ignorée, la sélection continue', () => {
    const { battle, unit, enemy } = setup();
    openCommandBar(battle);
    chooseOrder(battle, 'attack');
    selectUnit(battle, unit);

    expect(selectCell(battle, 4, 4)).toBe(false);
    expect(unit.command).toBeNull();
    expect(battle.commandSelection).toEqual({ order: 'attack', unit });

    chooseOrder(battle, 'move');
    selectUnit(battle, unit);
    expect(selectEnemy(battle, enemy)).toBe(false);
  });

  test('les ordres restent refusés tant que la barre est fermée', () => {
    const { battle, unit, enemy } = setup();

    expect(chooseOrder(battle, 'attack')).toBe(false);
    expect(selectUnit(battle, unit)).toBe(false);
    expect(selectEnemy(battle, enemy)).toBe(false);
  });
});

describe('voie 2 — ordre déduit de la cible (rules.md 5)', () => {
  test('unité puis ennemi = attack', () => {
    const { battle, unit, enemy } = setup();
    openCommandBar(battle);

    clickField(battle, 1, 1);
    clickField(battle, 8, 8);

    expect(unit.command).toEqual({ type: 'attack', target: enemy });
  });

  test('unité puis case = move', () => {
    const { battle, unit } = setup();
    openCommandBar(battle);

    clickField(battle, 1, 1);
    clickField(battle, 3, 2);

    expect(unit.command).toEqual({ type: 'moveTo', x: 3, y: 2 });
  });

  test('flee n\'est jamais déduit : sans ordre, sélectionner l\'unité ne fait pas fuir', () => {
    const { battle, unit } = setup();
    openCommandBar(battle);

    selectUnit(battle, unit);

    expect(unit.command).toBeNull();
    expect(battle.commandSelection).toEqual({ order: null, unit });
  });

  test('cliquer une autre unité du joueur change l\'unité sélectionnée', () => {
    const { battle, unit } = setup();
    const { unit: other } = deployPlayerUnit(battle, ROSTER.fighter, 2, 5);
    openCommandBar(battle);

    clickField(battle, 1, 1);
    clickField(battle, 2, 5);

    expect(battle.commandSelection.unit).toBe(other);
    expect(unit.command).toBeNull();
  });
});

describe('annulation (rules.md 5)', () => {
  test.each([
    ['barre ouverte', () => {}],
    ['ordre choisi', (battle) => chooseOrder(battle, 'attack')],
    ['unité sélectionnée', (battle, unit) => { chooseOrder(battle, 'move'); selectUnit(battle, unit); }],
  ])('à l\'étape "%s" : aucune commande, cooldown non consommé, jeu relancé', (_, reachStep) => {
    const { battle, unit } = setup();
    openCommandBar(battle);
    reachStep(battle, unit);

    cancelCommand(battle);

    expect(unit.command).toBeNull();
    expect(battle.commandSelection).toBeNull();
    expect(canIssueCommand(battle.playerCommandState, battle.elapsedSeconds)).toBe(true);
    expect(battle.pause.interaction).toBeNull();
    expect(openCommandBar(battle)).toBe(true);
  });
});

describe('éléments cliquables mis en valeur (ui-battle-screen-decisions.md 3)', () => {
  test('choix de l\'unité : les unités du joueur', () => {
    const { battle, unit } = setup();
    openCommandBar(battle);

    expect(getClickableHighlights(battle)).toEqual({ zone: null, unitIds: new Set([unit.id]) });
  });

  test('cible de attack : les ennemis ; de move : tout le terrain ; voie 2 : les deux', () => {
    const { battle, unit, enemy } = setup();
    const wholeField = { x: 0, y: 0, width: 10, height: 10 };
    openCommandBar(battle);

    chooseOrder(battle, 'attack');
    selectUnit(battle, unit);
    expect(getClickableHighlights(battle)).toEqual({ zone: null, unitIds: new Set([enemy.id]) });

    chooseOrder(battle, 'move');
    selectUnit(battle, unit);
    expect(getClickableHighlights(battle)).toEqual({ zone: wholeField, unitIds: new Set() });

    cancelCommand(battle);
    openCommandBar(battle);
    selectUnit(battle, unit);
    expect(getClickableHighlights(battle)).toEqual({ zone: wholeField, unitIds: new Set([enemy.id]) });
  });

  test('drag de déploiement : la moitié du joueur', () => {
    const { battle } = setup();
    startDeploymentDrag(battle);

    expect(getClickableHighlights(battle)).toEqual({
      zone: { x: 0, y: 0, width: 5, height: 10 }, unitIds: new Set(),
    });
  });
});
