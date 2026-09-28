import { useCallback, useState } from 'react';
import IntroScreen from './screens/IntroScreen.jsx';
import FactionChoiceScreen from './screens/FactionChoiceScreen.jsx';
import BattleScreen from './screens/BattleScreen.jsx';
import VictoryScreen from './screens/VictoryScreen.jsx';
import DefeatScreen from './screens/DefeatScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import CivilizationScreen from './screens/CivilizationScreen.jsx';
import { ROSTERS } from './data/rosters.js';
import { countOwnedCopies } from './logic/deployment.js';
import {
  getSavedFaction, savePlayerFaction, hasWonFirstBattle, markFirstBattleWon, saveOwnedCopies,
  clearProgress,
} from './persistence.js';

// technical.md 5.2 : l'écran de départ se déduit de l'état persistant, pas d'un routeur.
function initialScreen() {
  if (!getSavedFaction()) return 'intro';
  if (!hasWonFirstBattle()) return 'battle';
  return 'home';
}

// technical.md 5.4 : navigation par état React simple dans le composant racine, pas de librairie
// de routing — un seul onglet, une session continue.
export default function App() {
  const [screen, setScreen] = useState(initialScreen);
  const [battleAttempt, setBattleAttempt] = useState(0); // change de clé = BattleScreen tout neuf
  const playerFaction = getSavedFaction();

  const chooseFaction = useCallback((faction) => {
    savePlayerFaction(faction);
    setScreen('battle');
  }, []);

  // technical.md 5.4 : les copies possédées ne sont figées qu'à la victoire — une tentative
  // ratée ne sauvegarde rien, ses pertes sont donc oubliées au "Réessayer".
  const handleVictory = useCallback((battle) => {
    const unitsOnField = battle.units.filter((u) => u.isOnField);
    saveOwnedCopies(countOwnedCopies(ROSTERS[playerFaction], battle.playerDeployment, 'player', unitsOnField));
    markFirstBattleWon();
    setScreen('victory');
  }, [playerFaction]);

  // rules.md 8.1 : un match nul n'est pas une victoire — même suite qu'une défaite (réessayer),
  // mais annoncé comme tel.
  const handleDefeat = useCallback((outcome) => setScreen(outcome === 'draw' ? 'draw' : 'defeat'), []);

  const retryBattle = useCallback(() => {
    setBattleAttempt((n) => n + 1);
    setScreen('battle');
  }, []);

  const goHome = useCallback(() => setScreen('home'), []);

  // Outil de test temporaire (voir HomeScreen) : repart comme au tout premier lancement.
  const resetDemo = useCallback(() => {
    clearProgress();
    setScreen('intro');
  }, []);

  if (screen === 'intro') {
    return <IntroScreen onContinue={() => setScreen('factionChoice')} />;
  }

  if (screen === 'factionChoice') {
    return <FactionChoiceScreen onChoose={chooseFaction} />;
  }

  if (screen === 'battle') {
    return (
      <BattleScreen
        key={battleAttempt}
        playerFaction={playerFaction}
        onVictory={handleVictory}
        onDefeat={handleDefeat}
      />
    );
  }

  if (screen === 'victory') {
    return <VictoryScreen onContinue={goHome} />;
  }

  if (screen === 'defeat' || screen === 'draw') {
    return <DefeatScreen isDraw={screen === 'draw'} onRetry={retryBattle} />;
  }

  if (screen === 'civilization') {
    return <CivilizationScreen playerFaction={playerFaction} onBack={goHome} />;
  }

  return (
    <HomeScreen
      playerFaction={playerFaction}
      onOpenCivilization={() => setScreen('civilization')}
      onReset={resetDemo}
    />
  );
}
