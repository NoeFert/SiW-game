// rules.md 5.2 : deux familles de pause, indépendantes et combinables.
// - Pause principale : interrupteur manuel du joueur (bouton ⏸ / Espace).
// - Pause d'interaction : automatique pendant un geste (drag de déploiement, sélection d'une
//   commande, confirmation d'abandon), levée à la fin ou à l'annulation du geste.
// Le temps de bataille ne s'écoule que si aucune des deux n'est active. Comme tous les
// compteurs (timers d'attaque, mouvements, cooldown, script IA, compte à rebours de 15 s)
// dépendent du temps de bataille, `tickBattle` n'a qu'à ne rien faire pour tous les geler.

// Choix par défaut encore à valider par le design (ui-battle-screen-decisions.md 2.3 / 3) :
// regroupés ici pour pouvoir les basculer sans toucher au reste du code.
export const PAUSE_DEFAULTS = {
  // true : la pause d'interaction démarre dès l'ouverture de la barre de commandes ;
  // false : seulement au premier choix (ordre ou unité).
  pauseOnCommandBarOpen: true,
  // true : plusieurs déploiements possibles pendant une même pause principale.
  multipleDeploymentsPerMainPause: true,
  // false : après un déploiement/une commande pendant la pause principale, le jeu reste en pause.
  resumeAfterActionInMainPause: false,
};

export function createPauseState() {
  return { main: false, interaction: null, deploymentsThisMainPause: 0 }; // interaction : null | 'deploy' | 'command' | 'surrender'
}

export function isBattleTimeRunning(pause) {
  return !pause.main && pause.interaction === null;
}

export function toggleMainPause(pause) {
  pause.main = !pause.main;
  pause.deploymentsThisMainPause = 0;
}

export function startInteraction(pause, kind) {
  pause.interaction = kind;
}

export function endInteraction(pause) {
  pause.interaction = null;
}

export function canStartDeploymentDuringPause(pause) {
  return !pause.main || PAUSE_DEFAULTS.multipleDeploymentsPerMainPause || pause.deploymentsThisMainPause === 0;
}

// À appeler après un déploiement ou une commande réussis.
export function recordPlayerAction(pause, kind) {
  if (!pause.main) return;
  if (kind === 'deploy') pause.deploymentsThisMainPause += 1;
  if (PAUSE_DEFAULTS.resumeAfterActionInMainPause) toggleMainPause(pause);
}
