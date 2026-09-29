import { useCallback, useState } from 'react';
import IntroScreen from './screens/IntroScreen.jsx';
import FactionChoiceScreen from './screens/FactionChoiceScreen.jsx';
import BattleScreen from './screens/BattleScreen.jsx';
import VictoryScreen from './screens/VictoryScreen.jsx';
import DefeatScreen from './screens/DefeatScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import CivilizationScreen from './screens/CivilizationScreen.jsx';
import SummonScreen from './screens/SummonScreen.jsx';
import DevMenu from './dev/DevMenu.jsx';
import { TEST_PROFILES, loadTestProfile } from './dev/testProfiles.js';
import { ROSTERS } from './data/rosters.js';
import { FIRST_BATTLE_ID, CLICKBAIT_BATTLE_ID } from './data/battles.js';
import { countOwnedCopies, getCasualtyReport } from './logic/deployment.js';
import {
  createStartingUnits, keepSurvivors, createArmy, STARTING_SPIRIT_STONES,
} from './logic/civilization.js';
import {
  getSavedFaction, savePlayerFaction, hasWonFirstBattle, markFirstBattleWon, getOwnedUnits,
  saveOwnedUnits, saveArmy, saveSpiritStones, isLegacySave, clearProgress,
} from './persistence.js';
import { TEXT } from './ui/strings.js';

// technical.md 5.1 : pour le Rendu 1, seule la version clickbait (le POC) est jouable. Le bouton
// MVP (jeu normal) est grisé et le jeu démarre toujours sur l'intro. Passer à false pour rouvrir.
const MVP_LOCKED = true;

// technical.md 5.2 : l'écran de départ se déduit de l'état persistant, pas d'un routeur.
// Une sauvegarde à l'ancien format (technical.md 5.4) est effacée : l'app repart de l'intro.
function initialScreen() {
  if (MVP_LOCKED) return 'intro';
  if (isLegacySave()) clearProgress();
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
  const [victoryReport, setVictoryReport] = useState(null); // bilan de victoire (clickbait)
  // technical.md 5.2 : SummonScreen s'ouvre depuis l'accueil (null) ou depuis la page de détail
  // d'une espèce (sa clé de roster) ; « Retour » ramène à l'écran d'origine.
  const [summonFrom, setSummonFrom] = useState(null);
  const isClickbait = mode === 'clickbait';
  const playerFaction = isClickbait ? clickbaitFaction : getSavedFaction();

  const startBattle = useCallback(() => {
    setBattleAttempt((n) => n + 1);
    setScreen('battle');
  }, []);

  // rules.md 11.1/11.3 : au choix de la faction, dotation de départ et somme de départ.
  const chooseFaction = useCallback((faction) => {
    if (isClickbait) {
      setClickbaitFaction(faction);
    } else {
      savePlayerFaction(faction);
      saveOwnedUnits(createStartingUnits(ROSTERS[faction]));
      saveSpiritStones(STARTING_SPIRIT_STONES);
    }
    startBattle();
  }, [isClickbait, startBattle]);

  // technical.md 5.4 : les pertes ne sont retirées qu'à la victoire — une tentative ratée ne
  // sauvegarde rien, ses pertes sont donc oubliées au "Réessayer". La victoire crée aussi
  // l'armée de départ avec tous les survivants (rules.md 11.2). Rien n'est sauvegardé en mode
  // clickbait : on y affiche à la place le bilan des unités en vie/perdues.
  const handleVictory = useCallback((battle) => {
    const unitsOnField = battle.units.filter((u) => u.isOnField);
    const roster = ROSTERS[playerFaction];
    if (isClickbait) {
      setVictoryReport(getCasualtyReport(roster, battle.playerDeployment, 'player', unitsOnField));
    } else {
      const survivors = countOwnedCopies(roster, battle.playerDeployment, 'player', unitsOnField);
      const units = keepSurvivors(getOwnedUnits(), survivors);
      saveOwnedUnits(units);
      saveArmy(createArmy(TEXT.defaultArmyName, units));
      markFirstBattleWon();
      setVictoryReport(null);
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
    content = (
      <IntroScreen
        onContinue={() => setScreen('factionChoice')}
        onClickbait={startClickbait}
        mvpLocked={MVP_LOCKED}
      />
    );
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
    content = <VictoryScreen onContinue={continueAfterVictory} report={victoryReport} />;
  } else if (screen === 'defeat' || screen === 'draw') {
    content = <DefeatScreen isDraw={screen === 'draw'} onRetry={startBattle} />;
  } else if (screen === 'civilization') {
    content = (
      <CivilizationScreen
        playerFaction={playerFaction}
        initialSpecies={summonFrom}
        onBack={goHome}
        onOpenSummon={(speciesKey) => {
          setSummonFrom(speciesKey);
          setScreen('summon');
        }}
      />
    );
  } else if (screen === 'summon') {
    content = (
      <SummonScreen
        playerFaction={playerFaction}
        onBack={() => setScreen(summonFrom ? 'civilization' : 'home')}
      />
    );
  } else {
    content = (
      <HomeScreen
        playerFaction={playerFaction}
        onOpenCivilization={() => {
          setSummonFrom(null);
          setScreen('civilization');
        }}
        onOpenSummon={() => {
          setSummonFrom(null);
          setScreen('summon');
        }}
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
