import {
  WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT, WYRMS_CLICKBAIT_PHASE_2_SCRIPT, UNDEAD_CLICKBAIT_PHASE_2_SCRIPT,
} from './battleScript.js';
import { STARTER_TUTORIAL, CLICKBAIT_TUTORIAL } from './tutorials.js';

// Statique — définition de chaque bataille, repérée par son identifiant.
// - phases : une ou plusieurs zones jouées l'une après l'autre (rules.md 7.3). Chaque phase a
//   le script de l'IA selon la faction qu'elle joue (`enemyScripts`, rules.md 7.1) et
//   `mirrored` : zone retournée horizontalement (fond et obstacles dans l'autre sens).
// - tutorial : étapes du tutoriel de cette bataille (technical.md 5.5), ou null.
export const BATTLES = {
  // Bataille 01 du jeu normal, avec le tutoriel de départ.
  firstBattle: {
    phases: [
      { enemyScripts: { wyrms: WYRMS_AI_SCRIPT, undead: UNDEAD_AI_SCRIPT }, mirrored: false },
    ],
    tutorial: STARTER_TUTORIAL,
  },
  // Bataille de la version clickbait (technical.md 5.6), indépendante du jeu normal : phase 1
  // identique à la bataille 01, puis phase 2 dans la zone suivante (fond retourné).
  clickbaitBattle: {
    phases: [
      { enemyScripts: { wyrms: WYRMS_AI_SCRIPT, undead: UNDEAD_AI_SCRIPT }, mirrored: false },
      {
        enemyScripts: { wyrms: WYRMS_CLICKBAIT_PHASE_2_SCRIPT, undead: UNDEAD_CLICKBAIT_PHASE_2_SCRIPT },
        mirrored: true,
      },
    ],
    tutorial: CLICKBAIT_TUTORIAL,
  },
};

// v1 : une seule bataille dans le jeu normal (roadmap.md).
export const FIRST_BATTLE_ID = 'firstBattle';
export const CLICKBAIT_BATTLE_ID = 'clickbaitBattle';
