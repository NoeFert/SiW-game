import Grid from '../../src/logic/grid.js';
import Unit from '../../src/logic/unit.js';
import { createAiScriptState, deployScheduledUnits } from '../../src/logic/aiScript.js';
import { isAdjacent, isInRange } from '../../src/logic/combat.js';
import { isValidDeploymentPosition } from '../../src/logic/deployment.js';
import { WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT } from '../../src/data/battleScript.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';

// Déploie une seule unité IA (faction 'enemy', moitié droite x >= 12) face aux unités données.
function deployOne(species, units, rng = Math.random) {
  const [unit] = deployScheduledUnits([{ time: 0, species }], createAiScriptState(), 0, 'enemy', new Grid(), units, rng);
  return unit;
}

describe('deployScheduledUnits — horaires (rules.md 7.1)', () => {
  test('déploie la bonne unité au bon instant (script Wyrms)', () => {
    const state = createAiScriptState();
    const grid = new Grid();

    let deployed = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 0, 'enemy', grid, []);
    expect(deployed).toHaveLength(1);
    expect(deployed[0].species).toBe(WYRMS_ROSTER.lambtonWorm);
    expect(deployed[0].faction).toBe('enemy');

    deployed = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 5, 'enemy', grid, deployed);
    expect(deployed).toHaveLength(0); // t=8s pas encore atteint

    deployed = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 8, 'enemy', grid, []);
    expect(deployed).toHaveLength(1);
    expect(deployed[0].species).toBe(WYRMS_ROSTER.amphiptere);
  });

  test('ne redéploie jamais deux fois la même entrée du script', () => {
    const state = createAiScriptState();
    const first = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 100, 'enemy', new Grid(), []);

    const again = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 200, 'enemy', new Grid(), first);

    expect(again).toHaveLength(0);
  });

  test('les 4 vagues sortent dans l\'ordre documenté, sans se chevaucher', () => {
    for (const [script, roster] of [
      [WYRMS_AI_SCRIPT, [WYRMS_ROSTER.lambtonWorm, WYRMS_ROSTER.amphiptere, WYRMS_ROSTER.lambtonWorm, WYRMS_ROSTER.fafnir]],
      [UNDEAD_AI_SCRIPT, [UNDEAD_ROSTER.newRebornSkeleton, UNDEAD_ROSTER.necromantInitiate, UNDEAD_ROSTER.newRebornSkeleton, UNDEAD_ROSTER.athos]],
    ]) {
      const deployed = deployScheduledUnits(script, createAiScriptState(), 35, 'enemy', new Grid(), []);

      expect(deployed.map((u) => u.species)).toEqual(roster);
      deployed.forEach((unit, i) => {
        const others = deployed.filter((_, j) => j !== i);
        expect(isValidDeploymentPosition(new Grid(), 'enemy', unit.species, unit.x, unit.y, others)).toBe(true);
      });
    }
  });

  test('une unité déployée par le script est un Unit normal, sans marquage spécial "IA"', () => {
    const unit = deployOne(WYRMS_ROSTER.lambtonWorm, []);

    expect(unit.status).toBe('idle');
    expect(unit.command).toBeNull();
    expect(unit.isOnField).toBe(true);
  });
});

describe('deployScheduledUnits — choix de la case (rules.md 7.2)', () => {
  test('I. sans ennemi sur le terrain : case valide de la moitié IA, jamais sur une unité', () => {
    const blocker = new Unit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 12, 0);
    for (const rng of [() => 0, () => 0.5, () => 0.999]) {
      const unit = deployOne(UNDEAD_ROSTER.athos, [blocker], rng);
      expect(isValidDeploymentPosition(new Grid(), 'enemy', unit.species, unit.x, unit.y, [blocker])).toBe(true);
    }
  });

  test('III. éradication : un corps-à-corps apparaît collé à l\'ennemi qui a le plus de PV', () => {
    const weak = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 11, 2);
    weak.hp = 10;
    const strong = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 11, 10);

    const unit = deployOne(UNDEAD_ROSTER.newRebornSkeleton, [weak, strong]);

    expect(isAdjacent(unit, strong)).toBe(true);
  });

  test('III. renfort prioritaire : vise l\'ennemi engagé avec un allié à 50 % de PV ou moins', () => {
    const woundedAlly = new Unit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 12, 2);
    woundedAlly.hp = 11; // 50 % de 22
    const attacker = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 11, 2);
    attacker.hp = 10;
    attacker.status = 'engaged';
    attacker.target = woundedAlly;
    const strong = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 11, 10); // cible d'éradication

    const unit = deployOne(UNDEAD_ROSTER.newRebornSkeleton, [woundedAlly, attacker, strong]);

    expect(isAdjacent(unit, attacker)).toBe(true);
  });

  test('III. une unité de tir apparaît à portée de la cible stratégique', () => {
    const strong = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 8, 3); // à 4 cases de la colonne 12
    const weak = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 11, 10);
    weak.hp = 10;

    const unit = deployOne(UNDEAD_ROSTER.necromantInitiate, [strong, weak]);

    expect(isInRange(unit, strong)).toBe(true);
  });

  test('II. cible stratégique hors d\'atteinte : se replie sur un autre ennemi (avantageuse)', () => {
    const strong = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 2, 5); // trop loin pour s'y coller
    const weak = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 11, 10);
    weak.hp = 10;

    const unit = deployOne(UNDEAD_ROSTER.newRebornSkeleton, [strong, weak]);

    expect(isAdjacent(unit, weak)).toBe(true);
  });

  test('II. aucun ennemi atteignable : case la plus proche d\'un ennemi', () => {
    const farEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 5);

    const melee = deployOne(UNDEAD_ROSTER.newRebornSkeleton, [farEnemy]);
    const ranged = deployOne(UNDEAD_ROSTER.necromantInitiate, [farEnemy]);

    expect(melee.x).toBe(12); // première colonne de la moitié IA
    expect(ranged.x).toBe(12);
  });

  test('aucune case valide libre : l\'entrée attend le tick suivant au lieu d\'être perdue', () => {
    const grid = new Grid(2, 1); // moitié IA = une seule case, (1,0)
    const state = createAiScriptState();
    const script = [{ time: 0, species: UNDEAD_ROSTER.newRebornSkeleton }];
    const occupant = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 0);

    expect(deployScheduledUnits(script, state, 1, 'enemy', grid, [occupant])).toHaveLength(0);

    occupant.hp = 0; // la case se libère
    expect(deployScheduledUnits(script, state, 2, 'enemy', grid, [occupant])).toHaveLength(1);
  });
});
