import Grid from '../../src/logic/grid.js';
import Unit from '../../src/logic/unit.js';
import { createAiScriptState, deployScheduledUnits } from '../../src/logic/aiScript.js';
import { isValidDeploymentPosition, PRESENCE_CAP } from '../../src/logic/deployment.js';
import { WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT } from '../../src/data/battleScript.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';

// Déploie une seule unité IA (faction 'enemy', moitié droite x >= 12) face aux unités données.
function deployOne(species, units, rng = Math.random) {
  const [unit] = deployScheduledUnits([{ time: 0, species }], createAiScriptState(), 0, 'enemy', new Grid(), units, rng);
  return unit;
}

const costOf = (speciesList) => speciesList.reduce((sum, species) => sum + species.cost, 0);

describe('deployScheduledUnits — horaires et plafond (rules.md 7.1, 2)', () => {
  test('les 6 unités du script, dans l\'ordre et aux instants documentés', () => {
    const entries = (script) => script.map(({ time, species }) => [time, species]);
    expect(entries(WYRMS_AI_SCRIPT)).toEqual([
      [0, WYRMS_ROSTER.lambtonWorm], [8, WYRMS_ROSTER.amphiptere],
      [20, WYRMS_ROSTER.lambtonWorm],
      [28, WYRMS_ROSTER.lambtonWorm], [28, WYRMS_ROSTER.lambtonWorm],
      [35, WYRMS_ROSTER.fafnir],
    ]);
    expect(entries(UNDEAD_AI_SCRIPT)).toEqual([
      [0, UNDEAD_ROSTER.newRebornSkeleton], [8, UNDEAD_ROSTER.necromantInitiate],
      [20, UNDEAD_ROSTER.newRebornSkeleton],
      [28, UNDEAD_ROSTER.newRebornSkeleton], [28, UNDEAD_ROSTER.newRebornSkeleton],
      [35, UNDEAD_ROSTER.athos],
    ]);
  });

  test('les deux unités de la vague de t=28 apparaissent au même tick', () => {
    const state = createAiScriptState();
    const deployed = deployScheduledUnits(UNDEAD_AI_SCRIPT, state, 28, 'enemy', new Grid(), [], () => 0);

    expect(deployed.filter((u) => u.species === UNDEAD_ROSTER.newRebornSkeleton)).toHaveLength(4);
    expect(state.nextIndex).toBe(UNDEAD_AI_SCRIPT.length - 1); // Athos pas encore
  });

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

  test('le plafond vivant n\'est jamais dépassé — la suite attend qu\'il se libère', () => {
    const { athos, necromantInitiate } = UNDEAD_ROSTER;
    const script = [athos, necromantInitiate, necromantInitiate].map((species) => ({ time: 0, species })); // 160 pts
    const state = createAiScriptState();
    const grid = new Grid();

    const deployed = deployScheduledUnits(script, state, 0, 'enemy', grid, []);
    expect(deployed.map((u) => u.species)).toEqual([athos, necromantInitiate]); // 135 pts, le 3e ferait 160
    expect(costOf(deployed.map((u) => u.species))).toBeLessThanOrEqual(PRESENCE_CAP);
    deployed.forEach((unit, i) => {
      const others = deployed.filter((_, j) => j !== i);
      expect(isValidDeploymentPosition(grid, 'enemy', unit.species, unit.x, unit.y, others)).toBe(true);
    });

    expect(deployScheduledUnits(script, state, 1, 'enemy', grid, deployed)).toHaveLength(0); // toujours plein

    deployed[1].hp = 0; // un Necromant meurt : ses points se libèrent
    expect(deployScheduledUnits(script, state, 2, 'enemy', grid, deployed)).toHaveLength(1);
  });

  test('ne redéploie jamais deux fois la même entrée du script', () => {
    const state = createAiScriptState();
    for (let t = 100; state.nextIndex < WYRMS_AI_SCRIPT.length; t++) {
      deployScheduledUnits(WYRMS_AI_SCRIPT, state, t, 'enemy', new Grid(), []); // terrain vidé à chaque appel
    }

    expect(deployScheduledUnits(WYRMS_AI_SCRIPT, state, 1000, 'enemy', new Grid(), [])).toHaveLength(0);
  });

  test('une unité déployée par le script est un Unit normal, sans marquage spécial "IA"', () => {
    const unit = deployOne(WYRMS_ROSTER.lambtonWorm, []);

    expect(unit.status).toBe('idle');
    expect(unit.command).toBeNull();
    expect(unit.isOnField).toBe(true);
  });
});

describe('deployScheduledUnits — entrée par le bord droit (rules.md 7.2)', () => {
  const RIGHT_EDGE = 23; // grille par défaut : 24 colonnes

  test('sans ennemi sur le terrain : une case libre du bord droit, jamais sur une unité', () => {
    const blocker = new Unit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', RIGHT_EDGE, 0);
    for (const rng of [() => 0, () => 0.5, () => 0.999]) {
      const unit = deployOne(UNDEAD_ROSTER.newRebornSkeleton, [blocker], rng);
      expect(unit.x).toBe(RIGHT_EDGE);
      expect(isValidDeploymentPosition(new Grid(), 'enemy', unit.species, unit.x, unit.y, [blocker])).toBe(true);
    }
  });

  test('un bloc 2x2 entre collé au bord droit', () => {
    const unit = deployOne(UNDEAD_ROSTER.athos, []);

    expect(unit.x).toBe(RIGHT_EDGE - 1);
  });

  test('éradication : entre sur la rangée la plus proche de l\'ennemi qui a le plus de PV', () => {
    const weak = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 2);
    weak.hp = 10;
    const strong = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 10);

    const unit = deployOne(UNDEAD_ROSTER.newRebornSkeleton, [weak, strong]);

    expect([unit.x, unit.y]).toEqual([RIGHT_EDGE, 10]);
  });

  test('renfort prioritaire : vise l\'ennemi engagé avec un allié à 50 % de PV ou moins', () => {
    const woundedAlly = new Unit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 12, 2);
    woundedAlly.hp = 11; // 50 % de 22
    const attacker = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 11, 2);
    attacker.hp = 10;
    attacker.status = 'engaged';
    attacker.target = woundedAlly;
    const strong = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 11, 10); // cible d'éradication

    const unit = deployOne(UNDEAD_ROSTER.newRebornSkeleton, [woundedAlly, attacker, strong]);

    expect([unit.x, unit.y]).toEqual([RIGHT_EDGE, 2]);
  });

  test('une vague de plusieurs unités entre groupée, sur des rangées voisines', () => {
    const target = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 7);
    const script = [0, 0, 0].map((time) => ({ time, species: UNDEAD_ROSTER.newRebornSkeleton }));

    const wave = deployScheduledUnits(script, createAiScriptState(), 0, 'enemy', new Grid(), [target], () => 0);

    expect(wave.map((u) => u.x)).toEqual([RIGHT_EDGE, RIGHT_EDGE, RIGHT_EDGE]);
    expect(wave.map((u) => u.y).sort((a, b) => a - b)).toEqual([6, 7, 8]);
  });

  test('bord d\'entrée plein : l\'entrée attend le tick suivant au lieu d\'être perdue', () => {
    const grid = new Grid(2, 1); // bord droit = une seule case, (1,0)
    const state = createAiScriptState();
    const script = [{ time: 0, species: UNDEAD_ROSTER.newRebornSkeleton }];
    const occupant = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 0);

    expect(deployScheduledUnits(script, state, 1, 'enemy', grid, [occupant])).toHaveLength(0);

    occupant.hp = 0; // la case se libère
    expect(deployScheduledUnits(script, state, 2, 'enemy', grid, [occupant])).toHaveLength(1);
  });
});
