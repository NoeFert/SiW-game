import { createAiScriptState, deployScheduledUnits } from '../../src/logic/aiScript.js';
import { WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT } from '../../src/data/battleScript.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';

describe('deployScheduledUnits (rules.md 7)', () => {
  test('déploie la bonne unité, au bon instant, à la bonne position (script Wyrms)', () => {
    const state = createAiScriptState();

    let deployed = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 0, 'enemy');
    expect(deployed).toHaveLength(1);
    expect(deployed[0].species).toBe(WYRMS_ROSTER.lambtonWorm);
    expect(deployed[0].faction).toBe('enemy');
    expect(deployed[0].x).toBe(WYRMS_AI_SCRIPT[0].x);
    expect(deployed[0].y).toBe(WYRMS_AI_SCRIPT[0].y);

    deployed = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 5, 'enemy');
    expect(deployed).toHaveLength(0); // t=8s pas encore atteint

    deployed = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 8, 'enemy');
    expect(deployed).toHaveLength(1);
    expect(deployed[0].species).toBe(WYRMS_ROSTER.amphiptere);
  });

  test('ne redéploie jamais deux fois la même entrée du script', () => {
    const state = createAiScriptState();
    deployScheduledUnits(WYRMS_AI_SCRIPT, state, 100, 'enemy'); // toutes les vagues d'un coup

    const again = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 200, 'enemy');

    expect(again).toHaveLength(0);
  });

  test('les 4 vagues du script Wyrms sortent dans l\'ordre documenté (rules.md 7.1)', () => {
    const state = createAiScriptState();

    const deployed = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 35, 'enemy');

    expect(deployed.map((u) => u.species)).toEqual([
      WYRMS_ROSTER.lambtonWorm,
      WYRMS_ROSTER.amphiptere,
      WYRMS_ROSTER.lambtonWorm,
      WYRMS_ROSTER.fafnir,
    ]);
  });

  test('les 4 vagues du script Morts-Vivants sortent dans l\'ordre documenté (rules.md 7.1)', () => {
    const state = createAiScriptState();

    const deployed = deployScheduledUnits(UNDEAD_AI_SCRIPT, state, 35, 'enemy');

    expect(deployed.map((u) => u.species)).toEqual([
      UNDEAD_ROSTER.newRebornSkeleton,
      UNDEAD_ROSTER.necromantInitiate,
      UNDEAD_ROSTER.newRebornSkeleton,
      UNDEAD_ROSTER.athos,
    ]);
  });

  test('une unité déployée par le script est un Unit normal, sans marquage spécial "IA"', () => {
    const state = createAiScriptState();
    const [unit] = deployScheduledUnits(WYRMS_AI_SCRIPT, state, 0, 'enemy');

    expect(unit.status).toBe('idle');
    expect(unit.command).toBeNull();
    expect(unit.isOnField).toBe(true);
  });
});
