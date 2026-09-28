import Phaser from 'phaser';
import Grid from '../logic/grid.js';
import { createBattle, tickBattle } from '../logic/battle.js';
import { isBattleTimeRunning } from '../logic/pause.js';
import { startTutorial } from '../logic/tutorial.js';
import { clickField, cancelCommand, getClickableHighlights } from '../logic/commandSelection.js';
import { ROSTERS } from '../data/rosters.js';
import { BATTLES } from '../data/battles.js';
import { BATTLEFIELD_OBSTACLES } from '../data/battlefield.js';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import { CELL_SIZE, cellCenter, healthBarColor } from '../renderConstants.js';
import { interactionState } from '../state/interactionState.js';

// Quadrillage de debug : repère de case utile en dev, pas pour le joueur. Passer à true pour
// le réafficher pendant qu'on travaille sur le placement des obstacles/scripts par exemple.
const DEBUG_SHOW_GRID = false;

// Signaux de pause (ui-battle-screen-decisions.md 3) : saturation appliquée au terrain via un
// FX ColorMatrix (-1 = niveaux de gris). Complète pendant la pause principale, partielle
// pendant une pause d'interaction ; ce qui est cliquable garde toujours ses couleurs.
const FULL_DESATURATION = -1;
const PARTIAL_DESATURATION = -0.7;

// Couleur du missile d'attaque à distance, par faction (voir fireProjectile).
const PROJECTILE_COLORS = {
  wyrms: 0xff8c1a, // orange
  undead: 0x7dffc8, // vert menthe
};

// Cette Scene gère exclusivement le champ de bataille (technical.md 2.2) : grille, sprites,
// animations, clics sur le terrain pendant la sélection d'une commande, signaux visuels de
// pause. Le déploiement (glisser-déposer) et la barre de commandes vivent dans la tour de
// commandement React (src/ui/) ; le choix de faction et l'écran de résultat vivent dans des écrans React
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
    this.battleDefinition = BATTLES[data.battleId]; // src/data/battles.js
  }

  preload() {
    this.load.image('battlefield', 'backgrounds/battlefield-01.png');
    for (const { key } of Object.values(SPECIES_SPRITES)) this.load.image(key, spritePath(key));
    this.load.image('rocks', 'sprites/rocks.png');
  }

  create() {
    const grid = new Grid(24, 14, BATTLEFIELD_OBSTACLES); // rules.md 1
    this.grid = grid;
    this.width = grid.width * CELL_SIZE;
    this.height = grid.height * CELL_SIZE;

    this.background = this.add.image(0, 0, 'battlefield').setOrigin(0, 0).setDisplaySize(this.width, this.height);
    this.backgroundFx = this.background.preFX?.addColorMatrix();
    // Copie non filtrée du background, rognée sur la zone cliquable pendant une interaction
    // (voir applyPauseColors) : c'est elle qui "reste en couleur" au-dessus du terrain désaturé.
    this.colorBackground = this.add.image(0, 0, 'battlefield').setOrigin(0, 0)
      .setDisplaySize(this.width, this.height).setVisible(false);
    this.drawGridLines(grid);
    this.drawObstacles(BATTLEFIELD_OBSTACLES);

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

  // rules.md 1 : obstacles infranchissables — un bloc 2x2 est dessiné comme un seul gros rocher.
  drawObstacles(obstacles) {
    this.obstacleViews = obstacles.map(({ x, y, size = 1 }) => {
      const center = cellCenter(x, y, size);
      const image = this.add.image(center.x, center.y, 'rocks')
        .setDisplaySize(CELL_SIZE * size * 0.95, CELL_SIZE * size * 0.95);
      return { x, y, fx: image.preFX?.addColorMatrix() };
    });
  }

  // rules.md 9 : le choix de faction lui-même vit maintenant dans FactionChoiceScreen (React,
  // technical.md 5) — cette Scene reçoit `playerFaction` déjà tranché via `init(data)`.
  startBattle(playerFaction) {
    const playerRoster = ROSTERS[playerFaction];
    const enemyRoster = ROSTERS[playerFaction === 'wyrms' ? 'undead' : 'wyrms'];
    const enemyFaction = playerFaction === 'wyrms' ? 'undead' : 'wyrms';
    const enemyScript = this.battleDefinition.enemyScripts[enemyFaction];

    this.battle = createBattle(this.grid, playerRoster, enemyRoster, enemyScript);
    const { tutorial } = this.battleDefinition;
    if (tutorial) startTutorial(this.battle, tutorial); // technical.md 5.5

    // Publie l'état pour la tour de commandement React (technical.md 2.2) : c'est le seul canal de
    // communication entre les deux couches, aucune ne référence les objets de l'autre.
    interactionState.battle = this.battle;

    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));

    this.createDeploymentZoneFrame();
    this.createSelectionIndicator();
    this.createCountdownBanner();
  }

  // rules.md 2 : cadre autour de la moitié gauche du terrain (zone de déploiement du joueur,
  // voir isValidDeploymentPosition), visible uniquement pendant un glisser depuis la tour.
  createDeploymentZoneFrame() {
    const zoneWidth = Math.floor(this.grid.width / 2) * CELL_SIZE;
    this.deploymentZoneFrame = this.add.rectangle(0, 0, zoneWidth, this.height, 0x3fa9f5, 0.12)
      .setOrigin(0, 0)
      .setStrokeStyle(4, 0x3fa9f5)
      .setVisible(false);
  }

  // -- Fin de bataille (rules.md 8) --------------------------------------------------------
  // Le compte à rebours reste ici pour l'instant (son affichage définitif est à concevoir) ;
  // l'abandon est dans la tour React, l'écran de résultat final dans des écrans React.

  createCountdownBanner() {
    this.countdownText = this.add.text(this.width / 2, 16, '', {
      fontSize: '15px', color: '#ffcc00', backgroundColor: '#000000', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 0).setVisible(false);
  }

  updateCountdownBanner() {
    const playerCountdown = this.battle.playerEndState.countdownRemaining;
    const enemyCountdown = this.battle.enemyEndState.countdownRemaining;

    if (playerCountdown !== null) {
      this.countdownText.setText(
        `⚠ Redéploie une unité avant ${playerCountdown.toFixed(1)}s, ou défaite automatique !`,
      );
      this.countdownText.setVisible(true);
    } else if (enemyCountdown !== null) {
      this.countdownText.setText(`L'IA doit redéployer avant ${enemyCountdown.toFixed(1)}s...`);
      this.countdownText.setVisible(true);
    } else {
      this.countdownText.setVisible(false);
    }
  }

  // Cache le HUD encore présent côté Phaser une fois la bataille terminée (rules.md 8 : plus
  // aucune interaction possible). L'écran de résultat lui-même est maintenant VictoryScreen/
  // DefeatScreen (React, technical.md 5) — BattleScreen.jsx navigue vers l'un ou l'autre dès
  // que `battle.outcome` change, cette Scene n'a donc plus qu'à figer son propre affichage.
  hideBattleUi() {
    this.countdownText.setVisible(false);
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

  flashUnit(unit, color) {
    const view = this.unitViews.get(unit.id);
    if (!view) return;
    const { visual } = view;
    visual.setTint(color);

    this.tweens.add({
      targets: visual,
      alpha: 0.3,
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        visual.setAlpha(1);
        visual.clearTint();
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
  // La barre de commandes est ouverte par la tour React ; tant qu'elle l'est, chaque clic sur
  // le terrain est transmis à commandSelection.js, qui décide de l'étape (unité, cible, ordre
  // déduit). Clic droit : annule la commande en cours.

  createSelectionIndicator() {
    this.selectionIndicator = this.add.rectangle(0, 0, CELL_SIZE, CELL_SIZE, 0xffff00, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(3, 0xffff00)
      .setVisible(false);
  }

  updateSelectionIndicator() {
    const unit = this.battle.commandSelection?.unit;
    if (!unit?.isOnField) {
      this.selectionIndicator.setVisible(false);
      return;
    }
    const size = unit.size * CELL_SIZE;
    this.selectionIndicator.setSize(size, size);
    this.selectionIndicator.setPosition(unit.x * CELL_SIZE, unit.y * CELL_SIZE);
    this.selectionIndicator.setVisible(true);
  }

  handlePointerDown(pointer) {
    if (this.battle.outcome !== 'ongoing') return; // bataille terminée : plus aucune interaction
    if (pointer.rightButtonDown()) {
      cancelCommand(this.battle);
      return;
    }
    clickField(this.battle, Math.floor(pointer.x / CELL_SIZE), Math.floor(pointer.y / CELL_SIZE));
  }

  // -- Signaux visuels de pause (ui-battle-screen-decisions.md 3) ---------------------------
  // Chaque élément du terrain porte son propre FX ColorMatrix : terrain désaturé, sauf ce qui
  // est cliquable (getClickableHighlights). Pas de calque opaque : tout reste visible et
  // cliquable. Sans WebGL (fallback Canvas), preFX n'existe pas et le signal est absent.

  applyPauseColors() {
    const { main, interaction } = this.battle.pause;
    let level = 0;
    if (main) level = FULL_DESATURATION;
    else if (interaction || this.battle.pause.tutorial) level = PARTIAL_DESATURATION;

    const { zone, unitIds } = getClickableHighlights(this.battle);
    const inZone = (x, y) => zone !== null
      && x >= zone.x && y >= zone.y && x < zone.x + zone.width && y < zone.y + zone.height;

    this.backgroundFx?.saturate(level);
    this.colorBackground.setVisible(level !== 0 && zone !== null);
    if (zone) {
      const scale = this.colorBackground.frame.width / this.width; // px de texture par px affiché
      this.colorBackground.setCrop(
        zone.x * CELL_SIZE * scale,
        zone.y * CELL_SIZE * scale,
        zone.width * CELL_SIZE * scale,
        zone.height * CELL_SIZE * scale,
      );
    }
    for (const obstacle of this.obstacleViews) obstacle.fx?.saturate(inZone(obstacle.x, obstacle.y) ? 0 : level);
    for (const [id, view] of this.unitViews) view.fx?.saturate(unitIds.has(id) ? 0 : level);
  }

  // -- Boucle par frame ---------------------------------------------------------------------

  update(time, deltaMs) {
    // Pendant toute pause (rules.md 5.2), la logique ne tick plus et les animations (tweens
    // de déplacement, missiles, textes flottants) sont gelées avec elle.
    // tickBattle est appelé même en pause : le tutoriel peut y changer d'étape.
    tickBattle(this.battle, deltaMs / 1000);
    this.processAbilityEvents(); // vide si la bataille n'a pas avancé
    this.tweens.paused = !isBattleTimeRunning(this.battle.pause) || this.battle.outcome !== 'ongoing';

    this.syncViews();
    this.updateSelectionIndicator();
    this.applyPauseColors();
    this.deploymentZoneFrame.setVisible(this.battle.pause.interaction === 'deploy');

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

    // Le joueur attaque vers la droite, l'IA vers la gauche : on retourne le dessin si besoin.
    const { key, facing } = SPECIES_SPRITES[unit.species.name];
    const attackDirection = unit.faction === 'player' ? 'right' : 'left';
    const visual = this.add.image(0, 0, key)
      .setDisplaySize(footprintSize * 0.9, footprintSize * 0.9)
      .setFlipX(facing !== null && facing !== attackDirection);
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
      container, barFill, barWidth, paralyzedBadge, visual, fx: visual.preFX?.addColorMatrix(),
      lastCellX: unit.x, lastCellY: unit.y, moveTween: null,
    };
    const center = cellCenter(unit.x, unit.y, unit.size);
    container.setPosition(center.x, center.y);
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
      const center = cellCenter(unit.x, unit.y, unit.size);
      view.moveTween = this.tweens.add({
        targets: view.container,
        x: center.x,
        y: center.y,
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
