import Unit from './unit.js';
import { isValidDeploymentPosition } from './deployment.js';
import { minDistanceBetweenFootprints } from './combat.js';

// rules.md 7 : le script ne fait QUE définir quoi/quand déployer, et la case est choisie au
// moment du déploiement (7.2) — une fois créée via `new Unit(...)`, l'unité IA suit exactement
// le comportement autonome déjà codé dans combat.js, sans aucune logique de décision en plus.
export function createAiScriptState() {
  return { nextIndex: 0 };
}

// rules.md 7.2 II : à portée de tir (unité à distance ou hybride), ou collée à la cible (corps-à-corps).
function isAdvantageous(species, distance) {
  return species.range ? distance > 1 && distance <= species.range : distance === 1;
}

// rules.md 7.2 III : renfort d'abord (ennemi engagé avec un allié à 50 % de ses PV ou moins),
// sinon éradication (le ou les ennemis ayant le plus de PV actuels).
function strategicTargets(enemies, allies) {
  const isWeak = (unit) => unit.hp <= unit.species.maxHp / 2;
  const reinforcement = enemies.filter((enemy) => allies.some((ally) => isWeak(ally) && (
    (enemy.status === 'engaged' && enemy.target === ally)
    || (ally.status === 'engaged' && ally.target === enemy)
  )));
  if (reinforcement.length > 0) return reinforcement;

  const maxHp = Math.max(...enemies.map((enemy) => enemy.hp));
  return enemies.filter((enemy) => enemy.hp === maxHp);
}

// rules.md 7.2 : case d'apparition tirée au hasard parmi les positions valides (I), en ne
// gardant que les stratégiques (III) si possible, sinon les avantageuses (II) si possible,
// sinon les plus proches d'un ennemi. `null` si aucune case valide n'est libre.
function chooseDeploymentPosition(species, faction, grid, unitsOnField, rng) {
  const valid = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (isValidDeploymentPosition(grid, faction, species, x, y, unitsOnField)) valid.push({ x, y });
    }
  }
  if (valid.length === 0) return null;

  const pick = (positions) => positions[Math.floor(rng() * positions.length)];
  const enemies = unitsOnField.filter((u) => u.faction !== faction);
  if (enemies.length === 0) return pick(valid);

  const allies = unitsOnField.filter((u) => u.faction === faction);
  const distanceTo = (position, target) => minDistanceBetweenFootprints({ ...position, size: species.size }, target);
  const nearAny = (targets) => valid.filter(
    (position) => targets.some((target) => isAdvantageous(species, distanceTo(position, target))),
  );

  const strategic = nearAny(strategicTargets(enemies, allies));
  if (strategic.length > 0) return pick(strategic);

  const advantageous = nearAny(enemies);
  if (advantageous.length > 0) return pick(advantageous);

  const distances = valid.map((position) => Math.min(...enemies.map((enemy) => distanceTo(position, enemy))));
  const closest = Math.min(...distances);
  return pick(valid.filter((_, i) => distances[i] === closest));
}

// `script` doit être trié par `time` croissant (voir src/data/battleScript.js). Renvoie les
// unités à déployer pour ce tick — celles dont l'heure de déploiement (temps absolu depuis
// le début de la bataille) est atteinte depuis le dernier appel — sans jamais en redéployer
// une deuxième fois. Si aucune case valide n'est libre, l'entrée attend le tick suivant (les
// suivantes aussi, pour garder l'ordre du script). `rng` : source d'aléa, injectable en test.
export function deployScheduledUnits(script, state, elapsedSeconds, faction, grid, units, rng = Math.random) {
  const unitsOnField = units.filter((u) => u.isOnField);
  const deployed = [];
  while (state.nextIndex < script.length && script[state.nextIndex].time <= elapsedSeconds) {
    const { species } = script[state.nextIndex];
    const position = chooseDeploymentPosition(species, faction, grid, unitsOnField, rng);
    if (!position) break;
    const unit = new Unit(species, faction, position.x, position.y);
    deployed.push(unit);
    unitsOnField.push(unit); // occupe déjà sa case pour l'entrée suivante du même tick
    state.nextIndex += 1;
  }
  return deployed;
}
