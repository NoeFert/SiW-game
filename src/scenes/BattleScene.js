import Phaser from 'phaser';
import Grid from '../logic/grid.js';
import { createBattle, tickBattle, deployPlayerUnit } from '../logic/battle.js';
import { createAiScriptState, deployScheduledUnits } from '../logic/aiScript.js';
import { WYRMS_ROSTER } from '../data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../data/undeadRoster.js';
import { WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT } from '../data/battleScript.js';

// technical.md section 3 : une case de grille fait 64x64 px à l'affichage.
export const CELL_SIZE = 64;

// Espèce -> clé d'asset chargée dans preload(). Amphiptère et Necromant Initiate n'ont pas
// encore de sprite fourni (voir assets/README.md) : ils restent en dehors de cette table et
// sont dessinés comme une forme géométrique simple (voir PLACEHOLDER_COLORS).
const SPRITE_KEYS = {
  'Lambton Worm': 'lambton-worm',
  'Fafnir the Cursed One': 'fafnir',
  'New-reborn Skeleton': 'new-reborn-skeleton',
  'Athos the Lord of Pain': 'athos',
};

const PLACEHOLDER_COLORS = {
  Amphiptère: 0x2ecc71,
  'Necromant Initiate': 0x9b59b6,
};

function healthBarColor(ratio) {
  if (ratio > 0.5) return 0x2ecc71;
  if (ratio > 0.25) return 0xf1c40f;
  return 0xe74c3c;
}

// Cette Scene ne contient aucune règle de jeu : elle initialise une bataille via battle.js
// (déploiement scripté des deux côtés pour l'instant, voir la note dans create()) et se
// contente, à chaque frame, de refléter l'état qu'elle lit dans `this.battle` — positions,
// PV, présence sur le terrain. Aucun input joueur pour cette étape.
export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
    this.unitViews = new Map(); // unit.id -> { container, sprite, barFill, barWidth }
  }

  preload() {
    this.load.image('battlefield', 'backgrounds/battlefield-01.png');
    this.load.image('fafnir', 'sprites/fafnir.png');
    this.load.image('athos', 'sprites/athos.png');
    this.load.image('lambton-worm', 'sprites/lambton-worm.png');
    this.load.image('new-reborn-skeleton', 'sprites/new-reborn-skeleton.png');
  }

  create() {
    const grid = new Grid(); // 24x14, sans obstacles (positions exactes non tranchées, rules.md 1)
    const width = grid.width * CELL_SIZE;
    const height = grid.height * CELL_SIZE;

    this.add.image(0, 0, 'battlefield').setOrigin(0, 0).setDisplaySize(width, height);
    this.drawGridLines(grid);

    // Étape rendu uniquement : les deux camps suivent temporairement un script de démo
    // (rules.md 7.1) le temps que le vrai déploiement interactif du joueur soit codé.
    this.battle = createBattle(grid, WYRMS_ROSTER, UNDEAD_ROSTER, UNDEAD_AI_SCRIPT);
    this.playerScript = WYRMS_AI_SCRIPT;
    this.playerScriptState = createAiScriptState();
  }

  drawGridLines(grid) {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xffffff, 0.15);
    for (let x = 0; x <= grid.width; x++) {
      graphics.lineBetween(x * CELL_SIZE, 0, x * CELL_SIZE, grid.height * CELL_SIZE);
    }
    for (let y = 0; y <= grid.height; y++) {
      graphics.lineBetween(0, y * CELL_SIZE, grid.width * CELL_SIZE, y * CELL_SIZE);
    }
  }

  // Déploiement scripté temporaire côté joueur (voir la note dans create()) — passe par
  // deployPlayerUnit comme le fera plus tard le vrai clic du joueur, pour respecter le
  // plafond de points/copies/légendaire (rules.md 2) dès maintenant.
  deployScriptedPlayerUnits() {
    const due = deployScheduledUnits(this.playerScript, this.playerScriptState, this.battle.elapsedSeconds, 'player');
    for (const scripted of due) {
      deployPlayerUnit(this.battle, scripted.species, scripted.x, scripted.y);
    }
  }

  update(time, deltaMs) {
    if (this.battle.outcome === 'ongoing') {
      tickBattle(this.battle, deltaMs / 1000);
      this.deployScriptedPlayerUnits();
    }
    this.syncViews();
  }

  syncViews() {
    for (const unit of this.battle.units) {
      const view = this.unitViews.get(unit.id);

      if (!unit.isOnField) {
        if (view) {
          view.container.destroy();
          this.unitViews.delete(unit.id);
        }
        continue;
      }

      if (view) {
        this.updateUnitView(view, unit);
      } else {
        this.unitViews.set(unit.id, this.createUnitView(unit));
      }
    }
  }

  createUnitView(unit) {
    const container = this.add.container(0, 0);
    const footprintSize = unit.size * CELL_SIZE;

    const spriteKey = SPRITE_KEYS[unit.species.name];
    const visual = spriteKey
      ? this.add.image(0, 0, spriteKey).setDisplaySize(footprintSize * 0.9, footprintSize * 0.9)
      : this.add.circle(0, 0, footprintSize * 0.4, PLACEHOLDER_COLORS[unit.species.name] ?? 0xffffff);
    container.add(visual);

    const barWidth = footprintSize * 0.8;
    const barY = -footprintSize / 2 - 10;
    const barBackground = this.add.rectangle(0, barY, barWidth, 6, 0x000000).setOrigin(0.5);
    const barFill = this.add.rectangle(-barWidth / 2, barY, barWidth, 6, 0x2ecc71).setOrigin(0, 0.5);
    container.add(barBackground);
    container.add(barFill);

    const view = { container, barFill, barWidth };
    this.updateUnitView(view, unit);
    return view;
  }

  updateUnitView(view, unit) {
    const centerX = (unit.x + unit.size / 2) * CELL_SIZE;
    const centerY = (unit.y + unit.size / 2) * CELL_SIZE;
    view.container.setPosition(centerX, centerY);

    const ratio = Math.max(0, unit.hp / unit.species.maxHp);
    view.barFill.setSize(view.barWidth * ratio, 6);
    view.barFill.fillColor = healthBarColor(ratio);
  }
}
