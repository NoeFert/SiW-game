import {
  WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT, WYRMS_CLICKBAIT_PHASE_1_SCRIPT, UNDEAD_CLICKBAIT_PHASE_1_SCRIPT,
  WYRMS_CLICKBAIT_PHASE_2_SCRIPT, UNDEAD_CLICKBAIT_PHASE_2_SCRIPT,
  WYRMS_CLICKBAIT_PHASE_3_SCRIPT, UNDEAD_CLICKBAIT_PHASE_3_SCRIPT,
} from './battleScript.js';
import { BATTLEFIELD_OBSTACLES, WALL_ZONE_OBSTACLES, FORT_ZONE_OBSTACLES } from './battlefield.js';
import { STARTER_TUTORIAL, CLICKBAIT_TUTORIAL } from './tutorials.js';

// Statique — définition de chaque bataille, repérée par son identifiant.
// - phases : une ou plusieurs zones jouées l'une après l'autre (rules.md 7.3). Chaque phase a
//   le script de l'IA selon la faction qu'elle joue (`enemyScripts`, rules.md 7.1), ses
//   obstacles (src/data/battlefield.js) et `flippedBackground` : image de fond affichée dans
//   l'autre sens (la même image sert à toutes les zones).
// - tutorial : étapes du tutoriel de cette bataille (technical.md 5.5), ou null.
// - victoryWhenScriptCleared : victoire dès que l'IA a fini le script de la dernière phase et
//   n'a plus d'unité vivante (rules.md 7.3), au lieu de la fin de bataille habituelle (8).
// - orders : ordres proposés dans la barre de commandes (rules.md 5), tous par défaut.
// - surrenderAllowed : bouton Abandonner disponible (rules.md 8.2), vrai par défaut.
export const BATTLES = {
  // Bataille 01 du jeu normal, avec le tutoriel de départ.
  firstBattle: {
    phases: [
      {
        enemyScripts: { wyrms: WYRMS_AI_SCRIPT, undead: UNDEAD_AI_SCRIPT },
        obstacles: BATTLEFIELD_OBSTACLES,
        flippedBackground: false,
      },
    ],
    tutorial: STARTER_TUTORIAL,
  },
  // Bataille de la version clickbait (technical.md 5.6), indépendante du jeu normal : phase 1
  // sur le terrain de la bataille 01 (vagues resserrées, sans légendaire), puis "Le mur" (phase 2) et "Le fort" (phase 3, provisoire).
  clickbaitBattle: {
    phases: [
      {
        enemyScripts: { wyrms: WYRMS_CLICKBAIT_PHASE_1_SCRIPT, undead: UNDEAD_CLICKBAIT_PHASE_1_SCRIPT },
        obstacles: BATTLEFIELD_OBSTACLES,
        flippedBackground: false,
      },
      {
        enemyScripts: { wyrms: WYRMS_CLICKBAIT_PHASE_2_SCRIPT, undead: UNDEAD_CLICKBAIT_PHASE_2_SCRIPT },
        obstacles: WALL_ZONE_OBSTACLES,
        flippedBackground: true,
      },
      {
        enemyScripts: { wyrms: WYRMS_CLICKBAIT_PHASE_3_SCRIPT, undead: UNDEAD_CLICKBAIT_PHASE_3_SCRIPT },
        obstacles: FORT_ZONE_OBSTACLES,
        flippedBackground: false,
      },
    ],
    tutorial: CLICKBAIT_TUTORIAL,
    victoryWhenScriptCleared: true,
    // POC-SPECS.md : seul l'ordre Fuir, pas d'abandon.
    orders: ['flee'],
    surrenderAllowed: false,
  },
};

// v1 : une seule bataille dans le jeu normal (roadmap.md).
export const FIRST_BATTLE_ID = 'firstBattle';
export const CLICKBAIT_BATTLE_ID = 'clickbaitBattle';
