import Phaser from 'phaser';
import Grid from '../logic/grid.js';
import { footprint } from '../logic/pathfinding.js';
import {
  createBattle, tickBattle, deployPlayerUnit, issuePlayerAttack, issuePlayerMoveTo, issuePlayerFlee,
} from '../logic/battle.js';
import { getReserve, getPresenceUsed, PRESENCE_CAP } from '../logic/deployment.js';
import { canIssueCommand, COMMAND_COOLDOWN_SECONDS } from '../logic/commands.js';
import { WYRMS_ROSTER } from '../data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../data/undeadRoster.js';
import { UNDEAD_AI_SCRIPT } from '../data/battleScript.js';

// technical.md section 3 : une case de grille fait 64x64 px à l'affichage.
export const CELL_SIZE = 64;

const BOTTOM_BAR_HEIGHT = 90;

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

// Cette Scene ne contient aucune règle de jeu : elle appelle battle.js/deployment.js/
// commands.js (déploiement, ciblage, cooldown, plafond de points...) et se contente de
// refléter/collecter l'intention du joueur à la souris. L'IA continue de suivre son script
// existant sans changement (rules.md 7), géré en interne par battle.js.
export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
    this.unitViews = new Map(); // unit.id -> { container, barFill, barWidth }
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
    this.barY = height - BOTTOM_BAR_HEIGHT;

    this.add.image(0, 0, 'battlefield').setOrigin(0, 0).setDisplaySize(width, height);
    this.drawGridLines(grid);

    this.battle = createBattle(grid, WYRMS_ROSTER, UNDEAD_ROSTER, UNDEAD_AI_SCRIPT);
    this.paused = false;
    this.pendingDeploySpecies = null;
    this.selectedUnit = null;

    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));

    this.createSelectionIndicator();
    this.createDeployPanel(width);
    this.createCommandPanel(width);
    this.createPauseBanner(width);
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

  // -- Déploiement interactif (rules.md 2) ----------------------------------------------

  createDeployPanel(width) {
    this.add.rectangle(0, this.barY, width, BOTTOM_BAR_HEIGHT, 0x000000, 0.75).setOrigin(0, 0);

    this.deployButtons = Object.values(WYRMS_ROSTER).map((species, index) => {
      const x = 10 + index * 190;
      const text = this.add.text(x, this.barY + 8, '', {
        fontSize: '13px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 6, y: 4 },
      })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.startDeployment(species));
      return { species, text };
    });

    this.budgetText = this.add.text(10, this.barY + BOTTOM_BAR_HEIGHT - 22, '', {
      fontSize: '13px', color: '#ffffff',
    });

    this.messageText = this.add.text(width / 2, this.barY - 24, '', {
      fontSize: '13px', color: '#ff6b6b', backgroundColor: '#000000', padding: { x: 6, y: 4 },
    }).setOrigin(0.5, 0);
  }

  startDeployment(species) {
    this.pendingDeploySpecies = species;
    this.selectedUnit = null;
    this.paused = true;
  }

  cancelDeployment() {
    this.pendingDeploySpecies = null;
    this.paused = false;
  }

  tryPlaceDeployment(gx, gy) {
    const result = deployPlayerUnit(this.battle, this.pendingDeploySpecies, gx, gy);
    if (result.success) {
      this.pendingDeploySpecies = null;
      this.paused = false;
    } else {
      this.showMessage(`Déploiement refusé : ${result.reason}`);
    }
  }

  showMessage(message) {
    this.messageText.setText(message);
    this.time.delayedCall(1500, () => this.messageText.setText(''));
  }

  updateDeployPanel() {
    const onField = this.battle.units.filter((u) => u.isOnField);
    for (const { species, text } of this.deployButtons) {
      const reserve = getReserve(this.battle.playerDeployment, species);
      const available = reserve.fresh + reserve.returningHp.length;
      const woundedNote = reserve.returningHp.length > 0 ? ` (fuis: ${reserve.returningHp.join(',')} PV)` : '';
      text.setText(`${species.name}\n${species.cost}pts x${available}${woundedNote}`);
      text.setColor(available > 0 ? '#ffffff' : '#888888');
    }
    const used = getPresenceUsed('player', onField);
    this.budgetText.setText(`Points de présence : ${used}/${PRESENCE_CAP}`);
  }

  // -- Commandes en cours de bataille (rules.md 5) --------------------------------------

  createCommandPanel(width) {
    this.fleeButton = this.add.text(width - 150, this.barY + 8, '\u{1F3F3} Fuir', {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#7a1f1f', padding: { x: 8, y: 6 },
    })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.selectedUnit) issuePlayerFlee(this.battle, this.selectedUnit);
      })
      .setVisible(false);

    this.cooldownBarBg = this.add.rectangle(width - 150, this.barY + 46, 130, 10, 0x333333).setOrigin(0, 0);
    this.cooldownBarFill = this.add.rectangle(width - 150, this.barY + 46, 130, 10, 0xe74c3c).setOrigin(0, 0);
    this.cooldownText = this.add.text(width - 150, this.barY + 60, '', { fontSize: '11px', color: '#cccccc' });

    for (const view of [this.fleeButton, this.cooldownBarBg, this.cooldownBarFill, this.cooldownText]) {
      view.setVisible(false);
    }
  }

  updateCommandPanel() {
    const hasSelection = !!(this.selectedUnit && this.selectedUnit.faction === 'player');
    this.fleeButton.setVisible(hasSelection);
    this.cooldownBarBg.setVisible(hasSelection);
    this.cooldownBarFill.setVisible(hasSelection);
    this.cooldownText.setVisible(hasSelection);
    if (!hasSelection) return;

    const ready = canIssueCommand(this.battle.playerCommandState, this.battle.elapsedSeconds);
    const remaining = ready
      ? 0
      : COMMAND_COOLDOWN_SECONDS - (this.battle.elapsedSeconds - this.battle.playerCommandState.lastCommandTime);

    this.fleeButton.setAlpha(ready ? 1 : 0.5);
    this.cooldownBarFill.width = 130 * (remaining / COMMAND_COOLDOWN_SECONDS);
    this.cooldownText.setText(ready ? 'Commande disponible' : `Cooldown : ${remaining.toFixed(1)}s`);
  }

  createPauseBanner(width) {
    this.pauseBanner = this.add.text(width / 2, 16, '', {
      fontSize: '16px', color: '#ffff00', backgroundColor: '#000000', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 0).setVisible(false);
  }

  updatePauseBanner() {
    if (!this.pendingDeploySpecies) {
      this.pauseBanner.setVisible(false);
      return;
    }
    this.pauseBanner.setText(
      `⏸ PAUSE — placement de ${this.pendingDeploySpecies.name} : clique ta moitié du terrain `
      + '(clic droit pour annuler)',
    );
    this.pauseBanner.setVisible(true);
  }

  // -- Sélection et input ----------------------------------------------------------------

  createSelectionIndicator() {
    this.selectionIndicator = this.add.rectangle(0, 0, CELL_SIZE, CELL_SIZE, 0xffff00, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(3, 0xffff00)
      .setVisible(false);
  }

  updateSelectionIndicator() {
    if (this.selectedUnit && !this.selectedUnit.isOnField) this.selectedUnit = null;
    if (!this.selectedUnit) {
      this.selectionIndicator.setVisible(false);
      return;
    }
    const size = this.selectedUnit.size * CELL_SIZE;
    this.selectionIndicator.setSize(size, size);
    this.selectionIndicator.setPosition(this.selectedUnit.x * CELL_SIZE, this.selectedUnit.y * CELL_SIZE);
    this.selectionIndicator.setVisible(true);
  }

  unitAt(gx, gy) {
    return this.battle.units.find(
      (unit) => unit.isOnField && footprint(unit.x, unit.y, unit.size).some((c) => c.x === gx && c.y === gy),
    );
  }

  handlePointerDown(pointer) {
    if (pointer.y >= this.barY) return; // les boutons de la barre gèrent eux-mêmes leur clic

    if (pointer.rightButtonDown()) {
      this.cancelDeployment();
      this.selectedUnit = null;
      return;
    }

    const gx = Math.floor(pointer.x / CELL_SIZE);
    const gy = Math.floor(pointer.y / CELL_SIZE);

    if (this.pendingDeploySpecies) {
      this.tryPlaceDeployment(gx, gy);
      return;
    }

    const clicked = this.unitAt(gx, gy);

    if (clicked && clicked.faction === 'player') {
      this.selectedUnit = clicked === this.selectedUnit ? null : clicked;
      return;
    }

    if (!this.selectedUnit) return;

    if (clicked && clicked.faction === 'enemy') {
      issuePlayerAttack(this.battle, this.selectedUnit, clicked);
    } else if (!clicked) {
      issuePlayerMoveTo(this.battle, this.selectedUnit, gx, gy);
    }
  }

  // -- Boucle par frame --------------------------------------------------------------------

  update(time, deltaMs) {
    if (!this.paused && this.battle.outcome === 'ongoing') {
      tickBattle(this.battle, deltaMs / 1000);
    }
    this.syncViews();
    this.updateSelectionIndicator();
    this.updateDeployPanel();
    this.updateCommandPanel();
    this.updatePauseBanner();
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
