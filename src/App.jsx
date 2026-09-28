import { useCallback, useState } from 'react';
import IntroScreen from './screens/IntroScreen.jsx';
import FactionChoiceScreen from './screens/FactionChoiceScreen.jsx';
import BattleScreen from './screens/BattleScreen.jsx';
import VictoryScreen from './screens/VictoryScreen.jsx';
import DefeatScreen from './screens/DefeatScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import CivilizationScreen from './screens/CivilizationScreen.jsx';
import DevMenu from './dev/DevMenu.jsx';
import { TEST_PROFILES, loadTestProfile } from './dev/testProfiles.js';
import { ROSTERS } from './data/rosters.js';
import { FIRST_BATTLE_ID, CLICKBAIT_BATTLE_ID } from './data/battles.js';
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
// Deux modes (technical.md 5.6) : 'game' (jeu normal, sauvegardé) et 'clickbait' (choix de
// faction -> bataille-clickbait, rien n'est sauvegardé, la faction reste en mémoire).
export default function App() {
  const [mode, setMode] = useState('game');
  const [screen, setScreen] = useState(initialScreen);
  const [battleAttempt, setBattleAttempt] = useState(0); // change de clé = BattleScreen tout neuf
  const [clickbaitFaction, setClickbaitFaction] = useState(null);
  const isClickbait = mode === 'clickbait';
  const playerFaction = isClickbait ? clickbaitFaction : getSavedFaction();

  const startBattle = useCallback(() => {
    setBattleAttempt((n) => n + 1);
    setScreen('battle');
  }, []);

  const chooseFaction = useCallback((faction) => {
    if (isClickbait) setClickbaitFaction(faction); else savePlayerFaction(faction);
    startBattle();
  }, [isClickbait, startBattle]);

  // technical.md 5.4 : les copies possédées ne sont figées qu'à la victoire — une tentative
  // ratée ne sauvegarde rien, ses pertes sont donc oubliées au "Réessayer". Rien n'est
  // sauvegardé en mode clickbait.
  const handleVictory = useCallback((battle) => {
    if (!isClickbait) {
      const unitsOnField = battle.units.filter((u) => u.isOnField);
      saveOwnedCopies(countOwnedCopies(ROSTERS[playerFaction], battle.playerDeployment, 'player', unitsOnField));
      markFirstBattleWon();
    }
    setScreen('victory');
  }, [isClickbait, playerFaction]);

  // rules.md 8.1 : un match nul n'est pas une victoire — même suite qu'une défaite (réessayer),
  // mais annoncé comme tel.
  const handleDefeat = useCallback((outcome) => setScreen(outcome === 'draw' ? 'draw' : 'defeat'), []);

  // Après une victoire : accueil dans le jeu normal, nouveau choix de faction en clickbait.
  const continueAfterVictory = useCallback(
    () => setScreen(isClickbait ? 'factionChoice' : 'home'),
    [isClickbait],
  );

  const goHome = useCallback(() => setScreen('home'), []);

  // Repart comme au tout premier lancement (menu devs).
  const restartGame = useCallback(() => {
    clearProgress();
    setMode('game');
    setScreen('intro');
  }, []);

  // technical.md 5.6 : version clickbait, depuis son choix de faction (intro et menu devs).
  const startClickbait = useCallback(() => {
    setMode('clickbait');
    setClickbaitFaction(null);
    setScreen('factionChoice');
  }, []);

  const devActions = [
    { label: 'restart game', run: restartGame },
    { label: 'restart clickbait', run: startClickbait },
    {
      label: 'test-wyrm',
      run: () => {
        loadTestProfile(TEST_PROFILES.testWyrm);
        setMode('game');
        setScreen('home');
      },
    },
  ];

  let content;
  if (screen === 'intro') {
    content = <IntroScreen onContinue={() => setScreen('factionChoice')} onClickbait={startClickbait} />;
  } else if (screen === 'factionChoice') {
    content = <FactionChoiceScreen onChoose={chooseFaction} />;
  } else if (screen === 'battle') {
    content = (
      <BattleScreen
        key={battleAttempt}
        playerFaction={playerFaction}
        battleId={isClickbait ? CLICKBAIT_BATTLE_ID : FIRST_BATTLE_ID}
        onVictory={handleVictory}
        onDefeat={handleDefeat}
      />
    );
  } else if (screen === 'victory') {
    content = <VictoryScreen onContinue={continueAfterVictory} />;
  } else if (screen === 'defeat' || screen === 'draw') {
    content = <DefeatScreen isDraw={screen === 'draw'} onRetry={startBattle} />;
  } else if (screen === 'civilization') {
    content = <CivilizationScreen playerFaction={playerFaction} onBack={goHome} />;
  } else {
    content = (
      <HomeScreen
        playerFaction={playerFaction}
        onOpenCivilization={() => setScreen('civilization')}
      />
    );
  }

  return (
    <>
      {content}
      {import.meta.env.DEV && <DevMenu actions={devActions} />}
    </>
  );
}
