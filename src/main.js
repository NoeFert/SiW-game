import Phaser from 'phaser';
import Grid from './logic/grid.js';
import BattleScene from './scenes/BattleScene.js';
import { CELL_SIZE } from './renderConstants.js';

const grid = new Grid(); // 24x14 par défaut — juste pour dimensionner le canevas (technical.md 3)

new Phaser.Game({
  type: Phaser.AUTO,
  width: grid.width * CELL_SIZE,
  height: grid.height * CELL_SIZE,
  parent: 'phaser-root',
  backgroundColor: '#101010',
  scene: [BattleScene],
});
