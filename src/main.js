import Phaser from 'phaser';
import Grid from './logic/grid.js';
import BattleScene, { CELL_SIZE } from './scenes/BattleScene.js';

const grid = new Grid(); // 24x14 par défaut — juste pour dimensionner le canevas (technical.md 3)

new Phaser.Game({
  type: Phaser.AUTO,
  width: grid.width * CELL_SIZE,
  height: grid.height * CELL_SIZE,
  parent: 'app',
  backgroundColor: '#101010',
  scene: [BattleScene],
});
