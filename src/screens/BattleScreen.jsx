import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import BattleSceneClass from '../scenes/BattleScene.js';
import CommandTower from '../ui/CommandTower.jsx';
import { GAME_WIDTH, GAME_HEIGHT } from '../renderConstants.js';
import { interactionState } from '../state/interactionState.js';

// technical.md 5.1/5.4 : une bataille repart de zéro à chaque entrée dans cet écran — le Game
// Phaser est créé au montage et détruit au démontage (React ne touche jamais ses objets internes,
// juste le conteneur DOM qu'il lui fournit via `containerRef`, technical.md 2.2). L'ID
// "phaser-root" est conservé sur ce conteneur car DeploymentList.jsx repère le <canvas> par
// ce sélecteur pour convertir les coordonnées de glisser-déposer (voir renderConstants.js).
export default function BattleScreen({ playerFaction, onVictory, onDefeat }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      parent: containerRef.current,
      backgroundColor: '#101010',
      scene: [BattleSceneClass],
      scale: {
        mode: Phaser.Scale.FIT,
        // Collé à la tour : la zone de déploiement du joueur touche la liste d'unités.
        autoCenter: Phaser.Scale.CENTER_VERTICALLY,
      },
    });
    game.scene.start('BattleScene', { playerFaction });

    return () => {
      game.destroy(true);
      interactionState.battle = null;
    };
  }, [playerFaction]);

  useEffect(() => {
    let frameId;
    const checkOutcome = () => {
      const outcome = interactionState.battle?.outcome;
      if (outcome === 'playerVictory') {
        onVictory(interactionState.battle); // App en extrait les copies possédées (5.4)
        return;
      }
      if (outcome === 'enemyVictory' || outcome === 'draw') {
        onDefeat(outcome); // 'draw' : match nul (rules.md 8.1), annoncé comme tel
        return;
      }
      frameId = requestAnimationFrame(checkOutcome);
    };
    frameId = requestAnimationFrame(checkOutcome);
    return () => cancelAnimationFrame(frameId);
  }, [onVictory, onDefeat]);

  return (
    // ui-battle-screen-decisions.md 1 : tour de commandement à gauche, terrain à droite,
    // côte à côte (jamais superposés). `dark` : thème sombre des composants 8bitcn de la tour.
    <div className="flex w-full h-full min-h-[720px]">
      <div className="dark flex-none h-full w-[clamp(300px,24%,400px)]">
        <CommandTower playerFaction={playerFaction} />
      </div>
      <div id="phaser-root" ref={containerRef} className="flex-1 min-w-0 h-full" />
    </div>
  );
}
