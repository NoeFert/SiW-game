import Unit from './unit.js';
import { isValidDeploymentPosition, getPresenceUsed, PRESENCE_CAP } from './deployment.js';

// rules.md 7 : le script ne fait QUE définir quoi/quand déployer, et la case est choisie au
// moment du déploiement (7.2) — une fois créée via `new Unit(...)`, l'unité IA suit exactement
// le comportement autonome déjà codé dans combat.js, sans aucune logique de décision en plus.
export function createAiScriptState() {
  return { nextIndex: 0 };
}

// rules.md 7.2 : cibles stratégiques — renfort d'abord (ennemi engagé avec un allié à 50 % de
// ses PV ou moins), sinon éradication (le ou les ennemis ayant le plus de PV actuels).
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

// rules.md 7.2 : l'IA entre par le bord de son camp (droit pour 'enemy'), pour que le joueur
// voie ses unités traverser le terrain. Parmi les positions libres collées à ce bord, elle
// garde celles dont la rangée est la plus proche d'une cible stratégique, puis tire au hasard. Sans
// ennemi sur le terrain, n'importe quelle position du bord. `null` si le bord est plein.
function chooseDeploymentPosition(species, faction, grid, unitsOnField, rng) {
  const x = faction === 'enemy' ? grid.width - species.size : 0;
  const valid = [];
  for (let y = 0; y <= grid.height - species.size; y++) {
    if (isValidDeploymentPosition(grid, faction, species, x, y, unitsOnField)) valid.push({ x, y });
  }
  if (valid.length === 0) return null;

  const pick = (positions) => positions[Math.floor(rng() * positions.length)];
  const enemies = unitsOnField.filter((u) => u.faction !== faction);
  if (enemies.length === 0) return pick(valid);

  // La colonne d'entrée est fixe : seul l'écart de rangées entre le bloc d'entrée et la cible
  // compte (0 si leurs rangées se chevauchent).
  const rowGap = ({ y }, target) => Math.max(0, target.y - (y + species.size - 1), y - (target.y + target.size - 1));
  const targets = strategicTargets(enemies, unitsOnField.filter((u) => u.faction === faction));
  const distances = valid.map((position) => Math.min(...targets.map((target) => rowGap(position, target))));
  const closest = Math.min(...distances);
  return pick(valid.filter((_, i) => distances[i] === closest));
}

// `script` doit être trié par `time` croissant (voir src/data/battleScript.js). Renvoie les
// unités à déployer pour ce tick — celles dont l'heure de déploiement (temps absolu depuis
// le début de la bataille) est atteinte depuis le dernier appel — sans jamais en redéployer
// une deuxième fois. Si l'unité ferait dépasser le plafond vivant de points de présence
// (rules.md 2, identique pour l'IA) ou si le bord d'entrée est plein (7.2), l'entrée attend un
// tick suivant (les suivantes aussi, pour garder l'ordre du script). `rng` : source d'aléa,
// injectable en test.
export function deployScheduledUnits(script, state, elapsedSeconds, faction, grid, units, rng = Math.random) {
  const unitsOnField = units.filter((u) => u.isOnField);
  const deployed = [];
  while (state.nextIndex < script.length && script[state.nextIndex].time <= elapsedSeconds) {
    const { species } = script[state.nextIndex];
    if (getPresenceUsed(faction, unitsOnField) + species.cost > PRESENCE_CAP) break;
    const position = chooseDeploymentPosition(species, faction, grid, unitsOnField, rng);
    if (!position) break;
    const unit = new Unit(species, faction, position.x, position.y);
    deployed.push(unit);
    unitsOnField.push(unit); // occupe déjà sa case pour l'entrée suivante du même tick
    state.nextIndex += 1;
  }
  return deployed;
}
