import Phaser from 'phaser';
import Grid from '../logic/grid.js';
import { footprint } from '../logic/pathfinding.js';
import {
  createBattle, tickBattle, issuePlayerAttack, issuePlayerMoveTo, surrenderPlayer,
} from '../logic/battle.js';
import { ROSTERS } from '../data/rosters.js';
import { WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT } from '../data/battleScript.js';
import { BATTLEFIELD_OBSTACLES } from '../data/battlefield.js';
import { CELL_SIZE } from '../renderConstants.js';
import { interactionState, exitCommandMode } from '../state/interactionState.js';

// Quadrillage de debug : repère de case utile en dev, pas pour le joueur. Passer à true pour
// le réafficher pendant qu'on travaille sur le placement des obstacles/scripts par exemple.
const DEBUG_SHOW_GRID = false;

// Espèce -> clé d'asset chargée dans preload(). Une espèce sans entrée ici serait dessinée
// comme un simple cercle coloré (voir PLACEHOLDER_COLORS) — plus aucune pour l'instant, tous
// les sprites du roster v1 sont fournis.
const SPRITE_KEYS = {
  'Lambton Worm': 'lambton-worm',
  'Fafnir the Cursed One': 'fafnir',
  'New-reborn Skeleton': 'new-reborn-skeleton',
  'Athos the Lord of Pain': 'athos',
  Amphiptère: 'ampiptere',
  'Necromant Initiate': 'necromant',
};

const PLACEHOLDER_COLORS = {};

// Couleur du missile d'attaque à distance, par faction (voir fireProjectile).
const PROJECTILE_COLORS = {
  wyrms: 0xff8c1a, // orange
  undead: 0x7dffc8, // vert menthe
};

function healthBarColor(ratio) {
  if (ratio > 0.5) return 0x2ecc71;
  if (ratio > 0.25) return 0xf1c40f;
  return 0xe74c3c;
}

// Cette Scene gère exclusivement le champ de bataille (technical.md 2.2) : grille, sprites,
// animations, clics sur le terrain (sélection/attaque/déplacement une fois le mode "Commandes"
// activé). Le déploiement (glisser-déposer) et le panneau de commandes vivent dans la sidebar
// React (src/ui/) ; le choix de faction et l'écran de résultat vivent dans des écrans React
// séparés (src/screens/, technical.md 5) — cette Scene est recréée par BattleScreen.jsx à
// chaque entrée dans l'écran de bataille, faction déjà connue (voir `init`). Les deux couches
// ne communiquent qu'à travers `interactionState` et l'objet `battle` qu'il expose.
export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
    this.unitViews = new Map(); // unit.id -> { container, barFill, barWidth, paralyzedBadge }
  }

  init(data) {
    this.playerFaction = data.playerFaction;
  }

  preload() {
    this.load.image('battlefield', 'backgrounds/battlefield-01.png');
    this.load.image('fafnir', 'sprites/fafnir.png');
    this.load.image('athos', 'sprites/athos.png');
    this.load.image('lambton-worm', 'sprites/lambton-worm.png');
    this.load.image('new-reborn-skeleton', 'sprites/new-reborn-skeleton.png');
    this.load.image('ampiptere', 'sprites/ampiptere.png');
    this.load.image('necromant', 'sprites/necromant.png');
    this.load.image('rocks', 'sprites/rocks.png');
  }

  create() {
    const grid = new Grid(24, 14, BATTLEFIELD_OBSTACLES); // rules.md 1
    this.grid = grid;
    this.width = grid.width * CELL_SIZE;
    this.height = grid.height * CELL_SIZE;

    this.add.image(0, 0, 'battlefield').setOrigin(0, 0).setDisplaySize(this.width, this.height);
    this.drawGridLines(grid);
    this.drawObstacles(grid);

    this.startBattle(this.playerFaction);
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
    graphics.setVisible(DEBUG_SHOW_GRID); // invisible pour le joueur (voir DEBUG_SHOW_GRID)
  }

  // rules.md 1 : obstacles infranchissables.
  drawObstacles(grid) {
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (grid.isObstacle(x, y)) {
          this.add.image((x + 0.5) * CELL_SIZE, (y + 0.5) * CELL_SIZE, 'rocks')
            .setDisplaySize(CELL_SIZE * 0.95, CELL_SIZE * 0.95);
        }
      }
    }
  }

  // rules.md 9 : le choix de faction lui-même vit maintenant dans FactionChoiceScreen (React,
  // technical.md 5) — cette Scene reçoit `playerFaction` déjà tranché via `init(data)`.
  startBattle(playerFaction) {
    const playerRoster = ROSTERS[playerFaction];
    const enemyRoster = ROSTERS[playerFaction === 'wyrms' ? 'undead' : 'wyrms'];
    const enemyScript = playerFaction === 'wyrms' ? UNDEAD_AI_SCRIPT : WYRMS_AI_SCRIPT;

    this.battle = createBattle(this.grid, playerRoster, enemyRoster, enemyScript);

    // Publie l'état pour la sidebar React (technical.md 2.2) : c'est le seul canal de
    // communication entre les deux couches, aucune ne référence les objets de l'autre.
    interactionState.battle = this.battle;
    interactionState.paused = false;
    interactionState.deploymentDragActive = false;
    interactionState.commandModeActive = false;
    interactionState.selectedUnit = null;

    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', (pointer, currentlyOver) => this.handlePointerDown(pointer, currentlyOver));

    this.createDeploymentZoneFrame();
    this.createSelectionIndicator();
    this.createCountdownBanner();
  }

  // rules.md 2 : cadre autour de la moitié gauche du terrain (zone de déploiement du joueur,
  // voir isValidDeploymentPosition), visible uniquement pendant un glisser depuis la sidebar.
  createDeploymentZoneFrame() {
    const zoneWidth = Math.floor(this.grid.width / 2) * CELL_SIZE;
    this.deploymentZoneFrame = this.add.rectangle(0, 0, zoneWidth, this.height, 0x3fa9f5, 0.12)
      .setOrigin(0, 0)
      .setStrokeStyle(4, 0x3fa9f5)
      .setVisible(false);
  }

  // -- Fin de bataille (rules.md 8) --------------------------------------------------------
  // Le compte à rebours et le bouton d'abandon restent ici pour l'instant (ils concernent une
  // bataille encore EN COURS) ; seul l'écran de résultat final a été extrait vers React.

  createCountdownBanner() {
    this.countdownText = this.add.text(this.width / 2, 16, '', {
      fontSize: '15px', color: '#ffcc00', backgroundColor: '#000000', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 0).setVisible(false);

    this.surrenderButton = this.add.text(this.width / 2, 52, 'Abandonner', {
      fontSize: '13px', color: '#ffffff', backgroundColor: '#7a1f1f', padding: { x: 8, y: 6 },
    })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.battle.outcome === 'ongoing' && this.battle.playerEndState.countdownRemaining !== null) {
          surrenderPlayer(this.battle);
        }
      })
      .setVisible(false);
  }

  updateCountdownBanner() {
    const playerCountdown = this.battle.playerEndState.countdownRemaining;
    const enemyCountdown = this.battle.enemyEndState.countdownRemaining;

    if (playerCountdown !== null) {
      this.countdownText.setText(
        `⚠ Redéploie une unité avant ${playerCountdown.toFixed(1)}s, ou défaite automatique !`,
      );
      this.countdownText.setVisible(true);
      this.surrenderButton.setVisible(true);
    } else if (enemyCountdown !== null) {
      this.countdownText.setText(`L'IA doit redéployer avant ${enemyCountdown.toFixed(1)}s...`);
      this.countdownText.setVisible(true);
      this.surrenderButton.setVisible(false);
    } else {
      this.countdownText.setVisible(false);
      this.surrenderButton.setVisible(false);
    }
  }

  // Cache le HUD encore présent côté Phaser une fois la bataille terminée (rules.md 8 : plus
  // aucune interaction possible). L'écran de résultat lui-même est maintenant VictoryScreen/
  // DefeatScreen (React, technical.md 5) — BattleScreen.jsx navigue vers l'un ou l'autre dès
  // que `battle.outcome` change, cette Scene n'a donc plus qu'à figer son propre affichage.
  hideBattleUi() {
    this.countdownText.setVisible(false);
    this.surrenderButton.setVisible(false);
    this.selectionIndicator.setVisible(false);
  }

  // -- Feedback visuel des aptitudes (units.md, section 6) --------------------------------

  processAbilityEvents() {
    for (const event of this.battle.abilityEvents) {
      if (event.type === 'bonusDamage') {
        this.flashUnit(event.target, 0xffff00);
        this.cameras.main.shake(120, 0.006);
        this.spawnFloatingText(event.target, 'COUP CRITIQUE !', '#ffcc00');
      } else if (event.type === 'missed') {
        this.spawnFloatingText(event.unit, 'Raté !', '#cccccc');
      } else if (event.type === 'heal') {
        this.spawnFloatingText(event.unit, `+${event.amount}`, '#2ecc71');
        this.pulseHealthBar(event.unit);
      } else if (event.type === 'rangedAttack') {
        this.fireProjectile(event.unit, event.target);
      }
    }
  }

  // rules.md 4.5 : missile purement visuel — les dégâts ont déjà été appliqués par combat.js
  // à ce tick, ce tween ne fait que les illustrer. Couleur selon la faction réelle du tireur
  // (orange Wyrms, vert menthe Morts-Vivants), déduite de son camp player/enemy.
  fireProjectile(shooter, target) {
    const from = this.unitViews.get(shooter.id)?.container;
    const to = this.unitViews.get(target.id)?.container;
    if (!from || !to) return;

    const shooterFaction = shooter.faction === 'player'
      ? this.playerFaction
      : (this.playerFaction === 'wyrms' ? 'undead' : 'wyrms');
    const color = PROJECTILE_COLORS[shooterFaction];

    const missile = this.add.circle(from.x, from.y, 6, color).setStrokeStyle(2, 0xffffff).setDepth(10);
    const impactX = to.x;
    const impactY = to.y;
    this.tweens.add({
      targets: missile,
      x: impactX,
      y: impactY,
      duration: 220,
      onComplete: () => {
        missile.destroy();
        const impact = this.add.circle(impactX, impactY, 8, color, 0.9).setDepth(10);
        this.tweens.add({
          targets: impact, scale: 3, alpha: 0, duration: 180, onComplete: () => impact.destroy(),
        });
      },
    });
  }

  // Un sprite (Image) se teinte avec setTint/clearTint ; un placeholder (Arc) n'a pas cette
  // méthode, on bascule temporairement sa couleur de remplissage à la place.
  flashUnit(unit, color) {
    const view = this.unitViews.get(unit.id);
    if (!view) return;
    const { visual, isSprite } = view;
    const originalFill = visual.fillColor;
    if (isSprite) visual.setTint(color); else visual.fillColor = color;

    this.tweens.add({
      targets: visual,
      alpha: 0.3,
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        visual.setAlpha(1);
        if (isSprite) visual.clearTint(); else visual.fillColor = originalFill;
      },
    });
  }

  spawnFloatingText(unit, message, color) {
    const view = this.unitViews.get(unit.id);
    if (!view) return;
    const label = this.add.text(0, -unit.size * CELL_SIZE / 2 - 16, message, {
      fontSize: '13px', color, fontStyle: 'bold',
    }).setOrigin(0.5, 1);
    view.container.add(label);
    this.tweens.add({
      targets: label, y: label.y - 26, alpha: 0, duration: 900, onComplete: () => label.destroy(),
    });
  }

  pulseHealthBar(unit) {
    const view = this.unitViews.get(unit.id);
    if (!view) return;
    this.tweens.add({
      targets: view.barFill, scaleY: 2, duration: 150, yoyo: true,
    });
  }

  // -- Sélection et input sur le terrain (rules.md 5) --------------------------------------
  // Le mode "Commandes" est activé/désactivé par la sidebar React (interactionState) ; cette
  // Scene se contente de réagir aux clics sur le terrain tant que ce mode est actif : cliquer
  // une unité du joueur la sélectionne, cliquer un ennemi/une case donne la commande.

  createSelectionIndicator() {
    this.selectionIndicator = this.add.rectangle(0, 0, CELL_SIZE, CELL_SIZE, 0xffff00, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(3, 0xffff00)
      .setVisible(false);
  }

  updateSelectionIndicator() {
    const selected = interactionState.selectedUnit;
    if (selected && !selected.isOnField) interactionState.selectedUnit = null;
    if (!interactionState.selectedUnit) {
      this.selectionIndicator.setVisible(false);
      return;
    }
    const unit = interactionState.selectedUnit;
    const size = unit.size * CELL_SIZE;
    this.selectionIndicator.setSize(size, size);
    this.selectionIndicator.setPosition(unit.x * CELL_SIZE, unit.y * CELL_SIZE);
    this.selectionIndicator.setVisible(true);
  }

  unitAt(gx, gy) {
    return this.battle.units.find(
      (unit) => unit.isOnField && footprint(unit.x, unit.y, unit.size).some((c) => c.x === gx && c.y === gy),
    );
  }

  handlePointerDown(pointer, currentlyOver) {
    if (this.battle.outcome !== 'ongoing') return; // bataille terminée : plus aucune interaction
    // Un clic sur un bouton du HUD (ex : "Abandonner") n'est pas un clic sur le terrain.
    if (currentlyOver.includes(this.surrenderButton)) return;

    if (pointer.rightButtonDown()) {
      // Annule seulement le mode "Commandes" : sans ce garde-fou, un clic droit pendant un
      // glisser de déploiement relancerait le temps (exitCommandMode lève la pause).
      if (interactionState.commandModeActive) exitCommandMode();
      return;
    }

    if (!interactionState.commandModeActive) return; // hors du mode "Commandes", le terrain ignore le clic

    const gx = Math.floor(pointer.x / CELL_SIZE);
    const gy = Math.floor(pointer.y / CELL_SIZE);
    const clicked = this.unitAt(gx, gy);

    if (clicked && clicked.faction === 'player') {
      interactionState.selectedUnit = clicked === interactionState.selectedUnit ? null : clicked;
      return;
    }

    if (!interactionState.selectedUnit) return;

    if (clicked && clicked.faction === 'enemy') {
      issuePlayerAttack(this.battle, interactionState.selectedUnit, clicked);
      exitCommandMode(); // une seule commande par activation
    } else if (!clicked) {
      issuePlayerMoveTo(this.battle, interactionState.selectedUnit, gx, gy);
      exitCommandMode();
    }
  }

  // -- Boucle par frame ---------------------------------------------------------------------

  update(time, deltaMs) {
    if (!interactionState.paused && this.battle.outcome === 'ongoing') {
      tickBattle(this.battle, deltaMs / 1000);
      this.processAbilityEvents();
    }

    this.syncViews();
    this.updateSelectionIndicator();
    this.deploymentZoneFrame.setVisible(interactionState.deploymentDragActive);

    if (this.battle.outcome === 'ongoing') {
      this.updateCountdownBanner();
    } else {
      this.hideBattleUi();
    }
  }

  syncViews() {
    for (const unit of this.battle.units) {
      const view = this.unitViews.get(unit.id);

      if (!unit.isOnField) {
        if (view) {
          if (view.moveTween) view.moveTween.stop();
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

    // units.md 6 — Frappe paralysante d'Athos : badge persistant tant que la prochaine
    // attaque de cette unité est neutralisée (rules.md 6, disparaît exactement au moment
    // où l'attaque ratée est traitée, voir le tweet flottant "Raté !" en complément).
    const paralyzedBadge = this.add.text(footprintSize / 2 - 2, -footprintSize / 2 - 2, '\u{1F4AB}', {
      fontSize: '14px',
    }).setOrigin(1, 1).setVisible(false);
    container.add(paralyzedBadge);

    const view = {
      container, barFill, barWidth, paralyzedBadge, visual, isSprite: !!spriteKey,
      lastCellX: unit.x, lastCellY: unit.y, moveTween: null,
    };
    container.setPosition((unit.x + unit.size / 2) * CELL_SIZE, (unit.y + unit.size / 2) * CELL_SIZE);
    this.updateUnitView(view, unit);
    return view;
  }

  // rules.md 4.1 : la logique avance en continu (delta-time), mais ne "commet" une case qu'une
  // fois celle-ci pleinement franchie (voir moveToward/stepAwayFrom dans combat.js) — la Scene
  // ne connaît donc jamais de position fractionnaire à lire directement. On obtient un rendu
  // continu en douceur en animant (tween) le passage d'une case à l'autre plutôt qu'en
  // "sautant" instantanément, sur la durée réelle qu'aurait dû prendre ce trajet à la vitesse
  // de déplacement de l'unité (species.moveSpeed, en cases/s).
  updateUnitView(view, unit) {
    if (unit.x !== view.lastCellX || unit.y !== view.lastCellY) {
      const cellsMoved = Math.max(Math.abs(unit.x - view.lastCellX), Math.abs(unit.y - view.lastCellY));
      view.lastCellX = unit.x;
      view.lastCellY = unit.y;
      if (view.moveTween) view.moveTween.stop();
      view.moveTween = this.tweens.add({
        targets: view.container,
        x: (unit.x + unit.size / 2) * CELL_SIZE,
        y: (unit.y + unit.size / 2) * CELL_SIZE,
        duration: (cellsMoved / unit.species.moveSpeed) * 1000,
        ease: 'Linear',
      });
    }

    const ratio = Math.max(0, unit.hp / unit.species.maxHp);
    view.barFill.setSize(view.barWidth * ratio, 6);
    view.barFill.fillColor = healthBarColor(ratio);

    view.paralyzedBadge.setVisible(unit.paralyzedNextAttack === true);
  }
}
