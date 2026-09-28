import { WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT } from './battleScript.js';
import { STARTER_TUTORIAL, CLICKBAIT_TUTORIAL } from './tutorials.js';

// Statique — définition de chaque bataille, repérée par son identifiant. `enemyScripts` :
// script de l'IA selon la faction qu'elle joue (rules.md 7.1). `tutorial` : étapes du
// tutoriel de cette bataille (technical.md 5.5), ou null.
export const BATTLES = {
  // Bataille 01 du jeu normal, avec le tutoriel de départ.
  firstBattle: {
    enemyScripts: { wyrms: WYRMS_AI_SCRIPT, undead: UNDEAD_AI_SCRIPT },
    tutorial: STARTER_TUTORIAL,
  },
  // Bataille de la version clickbait (technical.md 5.6), indépendante du jeu normal. Même
  // terrain et mêmes scripts que la bataille 01 pour l'instant, avec le tutoriel clickbait.
  clickbaitBattle: {
    enemyScripts: { wyrms: WYRMS_AI_SCRIPT, undead: UNDEAD_AI_SCRIPT },
    tutorial: CLICKBAIT_TUTORIAL,
  },
};

// v1 : une seule bataille dans le jeu normal (roadmap.md).
export const FIRST_BATTLE_ID = 'firstBattle';
export const CLICKBAIT_BATTLE_ID = 'clickbaitBattle';
