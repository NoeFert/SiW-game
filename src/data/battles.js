import { WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT } from './battleScript.js';
import { FIRST_BATTLE_TUTORIAL } from './tutorials.js';

// Statique — définition de chaque bataille, repérée par son identifiant. `enemyScripts` :
// script de l'IA selon la faction qu'elle joue (rules.md 7.1). `tutorial` : étapes du
// tutoriel de cette bataille (technical.md 5.5), ou null.
export const BATTLES = {
  firstBattle: {
    enemyScripts: { wyrms: WYRMS_AI_SCRIPT, undead: UNDEAD_AI_SCRIPT },
    tutorial: FIRST_BATTLE_TUTORIAL,
  },
};

// v1 : une seule bataille (roadmap.md).
export const FIRST_BATTLE_ID = 'firstBattle';
