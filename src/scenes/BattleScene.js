import Phaser from 'phaser';
import Grid from '../logic/grid.js';
import { footprint } from '../logic/pathfinding.js';
import {
  createBattle, tickBattle, deployPlayerUnit, issuePlayerAttack, issuePlayerMoveTo, issuePlayerFlee,
  surrenderPlayer,
} from '../logic/battle.js';
import { getReserve, getPresenceUsed, PRESENCE_CAP } from '../logic/deployment.js';
import { canIssueCommand, COMMAND_COOLDOWN_SECONDS } from '../logic/commands.js';
import { WYRMS_ROSTER } from '../data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../data/undeadRoster.js';
import { WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT } from '../data/battleScript.js';
import { BATTLEFIELD_OBSTACLES } from '../data/battlefield.js';

// technical.md section 3 : une case de grille fait 64x64 px à l'affichage.
export const CELL_SIZE = 64;

const BOTTOM_BAR_HEIGHT = 90;

// Quadrillage de debug : repère de case utile en dev, pas pour le joueur. Passer à true pour
// le réafficher pendant qu'on travaille sur le placement des obstacles/scripts par exemple.
const DEBUG_SHOW_GRID = false;

const OUTCOME_LABELS = { playerVictory: 'VICTOIRE', enemyVictory: 'DÉFAITE', draw: 'ÉGALITÉ' };

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

function healthBarColor(ratio) {
  if (ratio > 0.5) return 0x2ecc71;
  if (ratio > 0.25) return 0xf1c40f;
  return 0xe74c3c;
}

// Cette Scene ne contient aucune règle de jeu : elle appelle battle.js/deployment.js/
// commands.js (déploiement, ciblage, cooldown, plafond de points, fin de bataille...) et se
// contente de refléter l'état lu et de collecter l'intention du joueur à la souris. L'IA
// continue de suivre son script existant sans changement (rules.md 7), géré par battle.js.
export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
    this.unitViews = new Map(); // unit.id -> { container, barFill, barWidth, paralyzedBadge }
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
    this.barY = this.height - BOTTOM_BAR_HEIGHT;

    this.add.image(0, 0, 'battlefield').setOrigin(0, 0).setDisplaySize(this.width, this.height);
    this.drawGridLines(grid);
    this.drawObstacles(grid);

    this.battle = null; // pas encore de bataille tant que la faction n'est pas choisie
    this.showFactionChoice();
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

  // -- Choix de faction (rules.md 9) ------------------------------------------------------

  showFactionChoice() {
    const overlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.7).setOrigin(0, 0);
    const title = this.add.text(this.width / 2, this.height / 2 - 90, 'Choisis ta faction', {
      fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5);

    const buttonStyle = {
      fontSize: '16px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 14, y: 10 },
    };
    const wyrmsBtn = this.add.text(this.width / 2 - 160, this.height / 2, 'Souveraine des Wyrms', buttonStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    const undeadBtn = this.add.text(this.width / 2 + 160, this.height / 2, 'Souverain des Morts-Vivants', buttonStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    const choose = (playerFaction) => {
      overlay.destroy();
      title.destroy();
      wyrmsBtn.destroy();
      undeadBtn.destroy();
      this.startBattle(playerFaction);
    };
    wyrmsBtn.on('pointerdown', () => choose('wyrms'));
    undeadBtn.on('pointerdown', () => choose('undead'));
  }

  startBattle(playerFaction) {
    this.playerRoster = playerFaction === 'wyrms' ? WYRMS_ROSTER : UNDEAD_ROSTER;
    const enemyRoster = playerFaction === 'wyrms' ? UNDEAD_ROSTER : WYRMS_ROSTER;
    const enemyScript = playerFaction === 'wyrms' ? UNDEAD_AI_SCRIPT : WYRMS_AI_SCRIPT;

    this.battle = createBattle(this.grid, this.playerRoster, enemyRoster, enemyScript);
    this.paused = false;
    this.pendingDeploySpecies = null;
    this.commandModeActive = false;
    this.selectedUnit = null;

    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));

    this.createSelectionIndicator();
    this.createDeployPanel();
    this.createCommandPanel();
    this.createPauseBanner();
    this.createCountdownBanner();
    this.createResultOverlay();
  }

  // -- Déploiement interactif par glisser-déposer (rules.md 2) ----------------------------
  // Glisser une icône d'unité disponible met la bataille en pause (pause tactique) ; relâcher
  // sur une case valide de la moitié du joueur déploie l'unité (deployPlayerUnit, inchangé :
  // plafond de points, copies, limite du [Légendaire] toujours appliqués là-bas). Relâcher
  // ailleurs (hors du terrain, ou sur une case refusée) annule sans déployer.

  createDeployPanel() {
    this.bottomBarBg = this.add.rectangle(0, this.barY, this.width, BOTTOM_BAR_HEIGHT, 0x000000, 0.75)
      .setOrigin(0, 0);

    this.deployButtons = Object.values(this.playerRoster).map((species, index) => {
      const x = 10 + index * 190;
      const text = this.add.text(x, this.barY + 8, '', {
        fontSize: '13px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 6, y: 4 },
      })
        .setInteractive({ useHandCursor: true, draggable: true })
        .on('dragstart', () => this.startDeployDrag(species))
        .on('drag', (pointer) => this.deployGhost?.setPosition(pointer.x, pointer.y))
        .on('dragend', (pointer) => this.endDeployDrag(pointer));
      return { species, text };
    });

    this.budgetText = this.add.text(10, this.barY + BOTTOM_BAR_HEIGHT - 22, '', {
      fontSize: '13px', color: '#ffffff',
    });

    this.messageText = this.add.text(this.width / 2, this.barY - 24, '', {
      fontSize: '13px', color: '#ff6b6b', backgroundColor: '#000000', padding: { x: 6, y: 4 },
    }).setOrigin(0.5, 0);
  }

  startDeployDrag(species) {
    if (this.battle.outcome !== 'ongoing' || this.commandModeActive) return;
    this.pendingDeploySpecies = species;
    this.selectedUnit = null;
    this.paused = true;

    const footprintSize = species.size * CELL_SIZE;
    const spriteKey = SPRITE_KEYS[species.name];
    this.deployGhost = spriteKey
      ? this.add.image(0, 0, spriteKey).setDisplaySize(footprintSize * 0.9, footprintSize * 0.9)
      : this.add.circle(0, 0, footprintSize * 0.4, PLACEHOLDER_COLORS[species.name] ?? 0xffffff);
    this.deployGhost.setAlpha(0.6);
  }

  endDeployDrag(pointer) {
    if (this.deployGhost) {
      this.deployGhost.destroy();
      this.deployGhost = null;
    }
    if (!this.pendingDeploySpecies) return; // le drag avait été refusé au départ (voir startDeployDrag)

    if (pointer.y < this.barY) { // relâché sur le terrain : tente le déploiement
      const result = deployPlayerUnit(this.battle, this.pendingDeploySpecies, Math.floor(pointer.x / CELL_SIZE),
        Math.floor(pointer.y / CELL_SIZE));
      if (!result.success) this.showMessage(`Déploiement refusé : ${result.reason}`);
    } // relâché sur la barre du bas : annulation silencieuse (comme reposer l'icône)

    this.cancelDeployment();
  }

  cancelDeployment() {
    this.pendingDeploySpecies = null;
    this.paused = false;
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

  // -- Commandes en cours de bataille (rules.md 5) ----------------------------------------
  // Le clic sur "Commandes" met la bataille en pause ; le joueur sélectionne alors une unité
  // puis lui donne une seule commande (attaquer/se déplacer/fuir), après quoi le jeu reprend
  // automatiquement. Le cooldown de 5s entre deux activations se compte en temps de bataille
  // (battle.elapsedSeconds) : comme celui-ci n'avance pas tant que `this.paused` est vrai, il
  // ne s'écoule jamais pendant que le panneau est ouvert.

  createCommandPanel() {
    this.commandButton = this.add.text(this.width - 300, this.barY + 8, 'Commandes', {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#2c3e50', padding: { x: 10, y: 6 },
    })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startCommandMode());

    this.cooldownBarBg = this.add.rectangle(this.width - 300, this.barY + 40, 130, 8, 0x333333).setOrigin(0, 0);
    this.cooldownBarFill = this.add.rectangle(this.width - 300, this.barY + 40, 130, 8, 0xe74c3c).setOrigin(0, 0);
    this.cooldownText = this.add.text(this.width - 300, this.barY + 52, '', { fontSize: '11px', color: '#cccccc' });

    this.fleeButton = this.add.text(this.width - 140, this.barY + 8, '\u{1F3F3} Fuir', {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#7a1f1f', padding: { x: 8, y: 6 },
    })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.selectedUnit && this.battle.outcome === 'ongoing') {
          issuePlayerFlee(this.battle, this.selectedUnit);
          this.exitCommandMode();
        }
      })
      .setVisible(false);
  }

  startCommandMode() {
    if (this.battle.outcome !== 'ongoing' || this.pendingDeploySpecies) return;
    if (!canIssueCommand(this.battle.playerCommandState, this.battle.elapsedSeconds)) return;
    this.commandModeActive = true;
    this.selectedUnit = null;
    this.paused = true;
  }

  exitCommandMode() {
    this.commandModeActive = false;
    this.selectedUnit = null;
    this.paused = false;
  }

  updateCommandPanel() {
    const ready = canIssueCommand(this.battle.playerCommandState, this.battle.elapsedSeconds);
    const remaining = ready
      ? 0
      : COMMAND_COOLDOWN_SECONDS - (this.battle.elapsedSeconds - this.battle.playerCommandState.lastCommandTime);

    const canOpen = ready && !this.pendingDeploySpecies && !this.commandModeActive;
    this.commandButton.setAlpha(canOpen ? 1 : 0.5);
    this.cooldownBarFill.setSize(130 * (remaining / COMMAND_COOLDOWN_SECONDS), 8);
    this.cooldownText.setText(ready ? 'Commande disponible' : `Cooldown : ${remaining.toFixed(1)}s`);

    this.fleeButton.setVisible(this.commandModeActive && !!this.selectedUnit);
  }

  createPauseBanner() {
    this.pauseBanner = this.add.text(this.width / 2, 16, '', {
      fontSize: '16px', color: '#ffff00', backgroundColor: '#000000', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 0).setVisible(false);
  }

  updatePauseBanner() {
    if (this.pendingDeploySpecies) {
      this.pauseBanner.setText(
        `⏸ PAUSE — relâche ${this.pendingDeploySpecies.name} sur ta moitié du terrain `
        + '(relâche ailleurs pour annuler)',
      );
      this.pauseBanner.setVisible(true);
    } else if (this.commandModeActive) {
      const instruction = this.selectedUnit
        ? 'clique un ennemi (attaquer), une case (se déplacer), ou "Fuir"'
        : 'sélectionne une unité';
      this.pauseBanner.setText(`⏸ PAUSE — Commande : ${instruction} (clic droit pour annuler)`);
      this.pauseBanner.setVisible(true);
    } else {
      this.pauseBanner.setVisible(false);
    }
  }

  // -- Fin de bataille (rules.md 8) --------------------------------------------------------

  createCountdownBanner() {
    this.countdownText = this.add.text(this.width / 2, 54, '', {
      fontSize: '15px', color: '#ffcc00', backgroundColor: '#000000', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 0).setVisible(false);

    this.surrenderButton = this.add.text(this.width / 2, 90, 'Abandonner', {
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

  createResultOverlay() {
    this.resultOverlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.75)
      .setOrigin(0, 0).setVisible(false);
    this.resultText = this.add.text(this.width / 2, this.height / 2, '', {
      fontSize: '42px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false);
  }

  updateResultOverlay() {
    const ended = this.battle.outcome !== 'ongoing';
    this.resultOverlay.setVisible(ended);
    this.resultText.setVisible(ended);
    if (ended) this.resultText.setText(OUTCOME_LABELS[this.battle.outcome]);
  }

  // Cache toute l'UI de bataille une fois celle-ci terminée (rules.md 8 : plus aucune
  // interaction possible, le jeu s'arrête proprement sur l'écran de résultat).
  hideBattleUi() {
    this.bottomBarBg.setVisible(false);
    for (const { text } of this.deployButtons) text.setVisible(false);
    this.budgetText.setVisible(false);
    this.messageText.setVisible(false);
    this.commandButton.setVisible(false);
    this.fleeButton.setVisible(false);
    this.cooldownBarBg.setVisible(false);
    this.cooldownBarFill.setVisible(false);
    this.cooldownText.setVisible(false);
    this.pauseBanner.setVisible(false);
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
      }
    }
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

  // -- Sélection et input ------------------------------------------------------------------

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
    if (this.battle.outcome !== 'ongoing') return; // bataille terminée : plus aucune interaction
    if (pointer.y >= this.barY) return; // les boutons de la barre gèrent eux-mêmes leur clic

    if (pointer.rightButtonDown()) {
      this.cancelDeployment();
      this.exitCommandMode();
      return;
    }

    if (this.pendingDeploySpecies) return; // déploiement en cours de glisser-déposer, pas de clic ici

    const gx = Math.floor(pointer.x / CELL_SIZE);
    const gy = Math.floor(pointer.y / CELL_SIZE);

    if (!this.commandModeActive) return; // en dehors du mode "Commandes", le terrain ne réagit pas au clic

    const clicked = this.unitAt(gx, gy);

    if (clicked && clicked.faction === 'player') {
      this.selectedUnit = clicked === this.selectedUnit ? null : clicked;
      return;
    }

    if (!this.selectedUnit) return;

    if (clicked && clicked.faction === 'enemy') {
      issuePlayerAttack(this.battle, this.selectedUnit, clicked);
      this.exitCommandMode(); // une seule commande par activation
    } else if (!clicked) {
      issuePlayerMoveTo(this.battle, this.selectedUnit, gx, gy);
      this.exitCommandMode();
    }
  }

  // -- Boucle par frame ---------------------------------------------------------------------

  update(time, deltaMs) {
    if (!this.battle) return; // en attente du choix de faction

    if (!this.paused && this.battle.outcome === 'ongoing') {
      tickBattle(this.battle, deltaMs / 1000);
      this.processAbilityEvents();
    }

    this.syncViews();
    this.updateSelectionIndicator();
    this.updateResultOverlay();

    if (this.battle.outcome === 'ongoing') {
      this.updateDeployPanel();
      this.updateCommandPanel();
      this.updatePauseBanner();
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
