import { footprint } from './pathfinding.js';
import { canIssueCommand } from './commands.js';
import { issuePlayerAttack, issuePlayerMoveTo, issuePlayerFlee } from './battle.js';
import {
  PAUSE_DEFAULTS, startInteraction, endInteraction, recordPlayerAction,
} from './pause.js';
import { tutorialAllows } from './tutorial.js';

// rules.md 5 : déroulé d'une commande depuis la barre de commandes. L'état vit dans
// `battle.commandSelection` : `null` quand la barre est fermée, sinon `{ order, unit }`.
// - Voie 1 (guidée) : ordre -> unité du joueur -> cible (ennemi pour `attack`, case pour
//   `move`, aucune pour `flee`).
// - Voie 2 (raccourci) : unité du joueur sans ordre -> l'ordre est déduit de la cible
//   (ennemi = `attack`, case = `move`). `flee` n'est jamais déductible.
// Annuler à n'importe quel stade n'émet rien et ne consomme pas le cooldown.
export const ORDERS = ['move', 'attack', 'flee'];

function isOpen(battle) {
  return battle.commandSelection !== null;
}

// Pendant le cooldown, un drag, une étape du tutoriel qui ne le demande pas, ou une fois la
// bataille finie, la barre ne s'ouvre pas.
export function canOpenCommandBar(battle) {
  return battle.outcome === 'ongoing'
    && !isOpen(battle)
    && battle.pause.interaction !== 'deploy'
    && !battle.phaseTransition
    && tutorialAllows(battle, 'openCommandBar')
    && canIssueCommand(battle.playerCommandState, battle.elapsedSeconds);
}

export function openCommandBar(battle) {
  if (!canOpenCommandBar(battle)) return false;
  battle.commandSelection = { order: null, unit: null };
  if (PAUSE_DEFAULTS.pauseOnCommandBarOpen) startInteraction(battle.pause, 'command');
  return true;
}

function close(battle) {
  battle.commandSelection = null;
  if (battle.pause.interaction === 'command') endInteraction(battle.pause);
}

export function cancelCommand(battle) {
  if (isOpen(battle)) close(battle);
}

function complete(battle, issued) {
  if (!issued) return false;
  close(battle);
  recordPlayerAction(battle.pause, 'command');
  return true;
}

// Choisir un ordre (re)démarre la voie 1 : l'unité éventuellement déjà sélectionnée est
// oubliée, pour que `flee` passe toujours par ordre -> unité.
export function chooseOrder(battle, order) {
  if (!isOpen(battle) || !ORDERS.includes(order) || !tutorialAllows(battle, `order:${order}`)) return false;
  startInteraction(battle.pause, 'command');
  battle.commandSelection = { order, unit: null };
  return true;
}

export function selectUnit(battle, unit) {
  if (!isOpen(battle) || unit.faction !== 'player' || !unit.isOnField) return false;
  if (!tutorialAllows(battle, `selectUnit:${battle.commandSelection.order ?? 'none'}`)) return false;
  startInteraction(battle.pause, 'command');
  battle.commandSelection.unit = unit;
  if (battle.commandSelection.order === 'flee') return complete(battle, issuePlayerFlee(battle, unit));
  return true;
}

function selectedActor(battle) {
  const unit = battle.commandSelection?.unit;
  return unit?.isOnField ? unit : null;
}

export function selectEnemy(battle, enemy) {
  const unit = selectedActor(battle);
  const { order } = battle.commandSelection ?? {};
  if (!unit || !(order === 'attack' || order === null) || enemy.faction !== 'enemy' || !enemy.isOnField) return false;
  if (!tutorialAllows(battle, 'selectTarget')) return false;
  return complete(battle, issuePlayerAttack(battle, unit, enemy));
}

export function selectCell(battle, x, y) {
  const unit = selectedActor(battle);
  const { order } = battle.commandSelection ?? {};
  if (!unit || !(order === 'move' || order === null) || !isInsideGrid(battle.grid, x, y)) return false;
  if (!tutorialAllows(battle, 'selectTarget')) return false;
  return complete(battle, issuePlayerMoveTo(battle, unit, x, y));
}

function isInsideGrid(grid, x, y) {
  return x >= 0 && y >= 0 && x < grid.width && y < grid.height;
}

export function unitAt(battle, x, y) {
  return battle.units.find(
    (unit) => unit.isOnField && footprint(unit.x, unit.y, unit.size).some((c) => c.x === x && c.y === y),
  ) ?? null;
}

// Clic sur la case (x, y) du terrain pendant la sélection : aiguille vers la bonne étape.
// Une unité du joueur (re)devient l'unité sélectionnée ; un ennemi ou une case vide sert de
// cible. Un clic invalide pour l'étape en cours est ignoré (la sélection continue).
export function clickField(battle, x, y) {
  if (!isOpen(battle)) return false;
  const clicked = unitAt(battle, x, y);
  if (clicked?.faction === 'player') return selectUnit(battle, clicked);
  if (clicked) return selectEnemy(battle, clicked);
  return selectCell(battle, x, y);
}

// Ce qui est cliquable à l'instant, pour la mise en couleur du terrain (ui-battle-screen-
// decisions.md 3) : `zone` = rectangle de cases valides (ou null), `unitIds` = unités valides.
export function getClickableHighlights(battle) {
  const wholeField = { x: 0, y: 0, width: battle.grid.width, height: battle.grid.height };
  const onField = battle.units.filter((u) => u.isOnField);
  const idsOf = (faction) => new Set(onField.filter((u) => u.faction === faction).map((u) => u.id));

  if (battle.pause.interaction === 'deploy') {
    return { zone: { ...wholeField, width: Math.floor(battle.grid.width / 2) }, unitIds: new Set() };
  }
  if (!isOpen(battle)) return { zone: null, unitIds: new Set() };

  const { order } = battle.commandSelection;
  if (!selectedActor(battle)) return { zone: null, unitIds: idsOf('player') };
  return {
    zone: order === 'attack' ? null : wholeField,
    unitIds: order === 'move' ? new Set() : idsOf('enemy'),
  };
}
