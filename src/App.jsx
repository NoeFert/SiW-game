import { Fragment, useCallback, useState } from 'react';
import IntroScreen from './screens/IntroScreen.jsx';
import FactionChoiceScreen from './screens/FactionChoiceScreen.jsx';
import BattleScreen from './screens/BattleScreen.jsx';
import VictoryScreen from './screens/VictoryScreen.jsx';
import DefeatScreen from './screens/DefeatScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import CivilizationScreen from './screens/CivilizationScreen.jsx';
import SummonScreen from './screens/SummonScreen.jsx';
import WarScreen from './screens/WarScreen.jsx';
import DevMenu from './dev/DevMenu.jsx';
import { TEST_PROFILES, loadTestProfile } from './dev/testProfiles.js';
import { ROSTERS } from './data/rosters.js';
import {
  BATTLES, FIRST_BATTLE_ID, CLICKBAIT_BATTLE_ID, WAR_BATTLE_IDS,
} from './data/battles.js';
import { armyUnits } from './logic/army.js';
import { getCasualtyReport } from './logic/deployment.js';
import { createStartingUnits } from './logic/ownedUnits.js';
import { STARTING_SPIRIT_STONES } from './logic/summon.js';
import { resolveVictory } from './logic/victory.js';
import { resolveWarDefeat, victoryReward } from './logic/war.js';
import {
  getSavedFaction, savePlayerFaction, hasWonFirstBattle, markFirstBattleWon, getOwnedUnits,
  saveOwnedUnits, getArmy, saveArmy, getSpiritStones, saveSpiritStones, getPlayerXp, savePlayerXp,
  getFallenLegendaryLevel, saveFallenLegendaryLevel, getWonWarBattles, saveWonWarBattles,
  getFountainLastHarvest, saveFountainLastHarvest, isLegacySave, clearProgress,
} from './persistence.js';
import { TEXT } from './ui/strings.js';

// technical.md 5.2 : pour le Rendu 1, seule la version clickbait (le POC) était jouable ; le MVP
// est rouvert depuis. Passer à true regriserait le bouton MVP et démarrerait toujours sur l'intro.
const MVP_LOCKED = false;

// rules.md 11.8 : la Spirit Fountain se met en route, vide, à la première arrivée sur l'accueil.
function startFountain() {
  if (getFountainLastHarvest() === null) saveFountainLastHarvest(Date.now());
}

// technical.md 5.2 : l'écran de départ se déduit de l'état persistant, pas d'un routeur.
// Une sauvegarde à l'ancien format (technical.md 5.4) est effacée : l'app repart de l'intro.
function initialScreen() {
  if (MVP_LOCKED) return 'intro';
  if (isLegacySave()) clearProgress();
  if (!getSavedFaction()) return 'intro';
  if (!hasWonFirstBattle()) return 'battle';
  startFountain();
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
  // Bataille du jeu normal en cours : la bataille 01, ou une de « Partir en guerre » (rules.md 11.7).
  const [battleId, setBattleId] = useState(FIRST_BATTLE_ID);
  const [clickbaitFaction, setClickbaitFaction] = useState(null);
  const [victoryReport, setVictoryReport] = useState(null); // bilan de victoire (clickbait)
  const [victoryProgress, setVictoryProgress] = useState(null); // XP et niveaux (jeu normal)
  const [defeatLosses, setDefeatLosses] = useState(null); // pertes d'une défaite de guerre
  // technical.md 5.2 : SummonScreen s'ouvre depuis l'accueil (null) ou depuis l'écran des unités
  // (clé de roster de l'espèce) ; « Retour » ramène à l'écran d'origine.
  const [summonFrom, setSummonFrom] = useState(null);
  const [saveVersion, setSaveVersion] = useState(0); // menu devs : recharge l'écran après un profil
  const isClickbait = mode === 'clickbait';
  const isWarBattle = !isClickbait && WAR_BATTLE_IDS.includes(battleId);
  const playerFaction = isClickbait ? clickbaitFaction : getSavedFaction();

  const startBattle = useCallback(() => {
    setBattleAttempt((n) => n + 1);
    setScreen('battle');
  }, []);

  const goHome = useCallback(() => {
    startFountain();
    setScreen('home');
  }, []);

  // rules.md 11.1/11.3 : au choix de la faction, dotation de départ et somme de départ.
  const chooseFaction = useCallback((faction) => {
    if (isClickbait) {
      setClickbaitFaction(faction);
    } else {
      savePlayerFaction(faction);
      saveOwnedUnits(createStartingUnits(ROSTERS[faction]));
      saveSpiritStones(STARTING_SPIRIT_STONES);
      setBattleId(FIRST_BATTLE_ID);
    }
    startBattle();
  }, [isClickbait, startBattle]);

  // rules.md 11.7 : lance une bataille de « Partir en guerre » avec l'armée.
  const startWarBattle = useCallback((id) => {
    setBattleId(id);
    startBattle();
  }, [startBattle]);

  // technical.md 5.4 : dans la bataille 01, pertes et XP ne sont comptées qu'à la victoire — une
  // tentative ratée ne sauvegarde rien. La victoire (resolveVictory, rules.md 11) retire les
  // morts, donne l'XP et la récompense (réduite au rejeu, 11.7), crée l'armée de départ après la
  // bataille 01, retient les batailles de guerre gagnées. Rien n'est sauvegardé en mode
  // clickbait : on y affiche à la place le bilan des unités en vie/perdues.
  // `battleUnits` : unités de la bataille (battle.units) ; vide quand la bataille 01 est passée
  // (rules.md 11 : skip). Renvoie le bilan de l'écran de victoire.
  const saveGameVictory = useCallback((battleUnits) => {
    const wonIds = getWonWarBattles();
    const { save, report } = resolveVictory(
      {
        units: getOwnedUnits(),
        army: getArmy(),
        playerXp: getPlayerXp(),
        spiritStones: getSpiritStones(),
        fallenLegendaryLevel: getFallenLegendaryLevel(),
      },
      battleUnits,
      ROSTERS[playerFaction],
      {
        firstBattle: battleId === FIRST_BATTLE_ID,
        armyName: TEXT.defaultArmyName,
        reward: victoryReward(BATTLES[battleId].reward, wonIds.includes(battleId)),
      },
    );
    saveOwnedUnits(save.units);
    saveArmy(save.army);
    savePlayerXp(save.playerXp);
    saveSpiritStones(save.spiritStones);
    if (save.fallenLegendaryLevel !== null) saveFallenLegendaryLevel(save.fallenLegendaryLevel);
    if (battleId === FIRST_BATTLE_ID) markFirstBattleWon();
    else if (!wonIds.includes(battleId)) saveWonWarBattles([...wonIds, battleId]);
    return report;
  }, [playerFaction, battleId]);

  const handleVictory = useCallback((battle) => {
    if (isClickbait) {
      const unitsOnField = battle.units.filter((u) => u.isOnField);
      setVictoryReport(
        getCasualtyReport(ROSTERS[playerFaction], battle.playerDeployment, 'player', unitsOnField),
      );
    } else {
      setVictoryReport(null);
      setVictoryProgress(saveGameVictory(battle.units));
    }
    setScreen('victory');
  }, [isClickbait, playerFaction, saveGameVictory]);

  // Bataille 01 passée avec « Skip » : comptée comme gagnée sans combat (aucune perte, armée de
  // départ avec toute la dotation, récompense et XP fixe du joueur), puis retour direct à l'accueil.
  const skipFirstBattle = useCallback(() => {
    saveGameVictory([]);
    goHome();
  }, [saveGameVictory, goHome]);

  // rules.md 8.1 : un match nul n'est pas une victoire — même suite qu'une défaite (réessayer),
  // mais annoncé comme tel. rules.md 11.7 : dans « Partir en guerre », les individus tués sont
  // perdus quand même (défaite, abandon ou match nul).
  const handleDefeat = useCallback((outcome, battle) => {
    if (isWarBattle) {
      const { save, lost } = resolveWarDefeat(
        { units: getOwnedUnits(), army: getArmy(), fallenLegendaryLevel: getFallenLegendaryLevel() },
        battle.units,
        ROSTERS[playerFaction],
      );
      saveOwnedUnits(save.units);
      saveArmy(save.army);
      if (save.fallenLegendaryLevel !== null) saveFallenLegendaryLevel(save.fallenLegendaryLevel);
      setDefeatLosses(lost);
    } else {
      setDefeatLosses(null);
    }
    setScreen(outcome === 'draw' ? 'draw' : 'defeat');
  }, [isWarBattle, playerFaction]);

  // Après une victoire : accueil dans le jeu normal, nouveau choix de faction en clickbait.
  const continueAfterVictory = useCallback(() => {
    if (isClickbait) setScreen('factionChoice');
    else goHome();
  }, [isClickbait, goHome]);

  // Repart comme au tout premier lancement (menu devs).
  const restartGame = useCallback(() => {
    clearProgress();
    setMode('game');
    setBattleId(FIRST_BATTLE_ID);
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
    ...[['test-wyrm', TEST_PROFILES.testWyrm], ['test-wyrm-fallen', TEST_PROFILES.testWyrmFallen],
      ['test-undead', TEST_PROFILES.testUndead]]
      .map(([label, profile]) => ({
        label,
        run: () => {
          loadTestProfile(profile);
          setSaveVersion((v) => v + 1);
          setMode('game');
          goHome();
        },
      })),
  ];

  // rules.md 2 : bataille 01 = tous les individus possédés ; « Partir en guerre » = l'armée ;
  // version clickbait = copies de units.md (null).
  const battleUnits = () => {
    if (isClickbait) return null;
    const owned = getOwnedUnits();
    return isWarBattle ? armyUnits(getArmy(), owned) : owned;
  };

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
        battleId={isClickbait ? CLICKBAIT_BATTLE_ID : battleId}
        playerUnits={battleUnits()}
        onVictory={handleVictory}
        onDefeat={handleDefeat}
        onSkip={!isClickbait && battleId === FIRST_BATTLE_ID ? skipFirstBattle : null}
      />
    );
  } else if (screen === 'victory') {
    content = (
      <VictoryScreen
        onContinue={continueAfterVictory}
        report={victoryReport}
        progress={victoryProgress}
        playerFaction={playerFaction}
      />
    );
  } else if (screen === 'defeat' || screen === 'draw') {
    content = (
      <DefeatScreen
        isDraw={screen === 'draw'}
        onRetry={startBattle}
        lost={defeatLosses}
        onHome={isWarBattle ? goHome : null}
        canRetry={!isWarBattle || armyUnits(getArmy(), getOwnedUnits()).length > 0}
      />
    );
  } else if (screen === 'war') {
    content = <WarScreen playerFaction={playerFaction} onFight={startWarBattle} onBack={goHome} />;
  } else if (screen === 'units' || screen === 'army') {
    content = (
      <CivilizationScreen
        key={screen}
        playerFaction={playerFaction}
        section={screen}
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
        onBack={() => (summonFrom ? setScreen('units') : goHome())}
      />
    );
  } else {
    content = (
      <HomeScreen
        playerFaction={playerFaction}
        onOpenWar={() => setScreen('war')}
        onOpenUnits={() => {
          setSummonFrom(null);
          setScreen('units');
        }}
        onOpenArmy={() => {
          setSummonFrom(null);
          setScreen('army');
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
      {/* GRAPHICS.md « Interface » : la faction du joueur choisit la teinte des accents (pixel-ui.css). */}
      <div data-faction={playerFaction ?? undefined} className="contents">
        <Fragment key={saveVersion}>{content}</Fragment>
      </div>
      {import.meta.env.DEV && <DevMenu actions={devActions} />}
    </>
  );
}
