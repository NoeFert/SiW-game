import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import BattleSceneClass from '../scenes/BattleScene.js';
import CommandTower from '../ui/CommandTower.jsx';
import TutorialOverlay from '../ui/TutorialOverlay.jsx';
import { GAME_WIDTH, GAME_HEIGHT } from '../renderConstants.js';
import { interactionState } from '../state/interactionState.js';

// Délai entre la victoire et l'affichage de l'écran de victoire.
const VICTORY_SCREEN_DELAY_MS = 3000;

// technical.md 5.1/5.4 : une bataille repart de zéro à chaque entrée dans cet écran — le Game
// Phaser est créé au montage et détruit au démontage (React ne touche jamais ses objets internes,
// juste le conteneur DOM qu'il lui fournit via `containerRef`, technical.md 2.2). L'ID
// "phaser-root" est conservé sur ce conteneur car DeploymentList.jsx repère le <canvas> par
// ce sélecteur pour convertir les coordonnées de glisser-déposer (voir renderConstants.js).
// `battleId` : bataille à jouer (src/data/battles.js), avec son tutoriel s'il en a un.
// `playerUnits` : individus du joueur engagés (jeu normal, rules.md 2), ou null (clickbait).
export default function BattleScreen({
  playerFaction, battleId, playerUnits, onVictory, onDefeat,
}) {
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
    game.scene.start('BattleScene', { playerFaction, battleId, playerUnits });

    return () => {
      game.destroy(true);
      interactionState.battle = null;
    };
    // playerUnits n'est lu qu'au montage : chaque tentative remonte l'écran (clé battleAttempt).
  }, [playerFaction, battleId]);

  useEffect(() => {
    let frameId;
    let victoryTimeoutId;
    const checkOutcome = () => {
      const outcome = interactionState.battle?.outcome;
      if (outcome === 'playerVictory') {
        // Le terrain reste affiché quelques secondes avant l'écran de victoire.
        const { battle } = interactionState;
        victoryTimeoutId = setTimeout(() => onVictory(battle), VICTORY_SCREEN_DELAY_MS); // App en tire pertes et XP (5.4)
        return;
      }
      if (outcome === 'enemyVictory' || outcome === 'draw') {
        onDefeat(outcome); // 'draw' : match nul (rules.md 8.1), annoncé comme tel
        return;
      }
      frameId = requestAnimationFrame(checkOutcome);
    };
    frameId = requestAnimationFrame(checkOutcome);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(victoryTimeoutId);
    };
  }, [onVictory, onDefeat]);

  return (
    // ui-battle-screen-decisions.md 1 : tour de commandement à gauche, terrain à droite,
    // côte à côte (jamais superposés). `dark` : thème sombre des composants 8bitcn de la tour.
    <div className="flex w-full h-full min-h-[720px]">
      <div className="dark flex-none h-full w-[clamp(300px,24%,400px)]">
        <CommandTower playerFaction={playerFaction} />
      </div>
      <div id="phaser-root" ref={containerRef} className="flex-1 min-w-0 h-full" />
      <TutorialOverlay />
    </div>
  );
}
