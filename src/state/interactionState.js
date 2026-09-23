// Pont d'état partagé entre la Scene Phaser (clics sur le terrain) et la sidebar React
// (bouton "Commandes", déploiement) — ni l'un ni l'autre ne touche au DOM ou aux objets de
// l'autre (technical.md 2.2) : ils lisent/écrivent seulement ces quelques champs.
//
// `battle` est l'instance créée par battle.js une fois la faction choisie (encore décidé dans
// BattleScene pour l'instant) ; `null` tant que la bataille n'a pas commencé.
// `paused` : pause tactique (déploiement en cours de glisser, ou mode "Commandes" actif).
// `commandModeActive` / `selectedUnit` : état du panneau de sélection de commande (React),
// mis à jour aussi par la Scene quand le joueur clique une unité/case/ennemi sur le terrain.
export const interactionState = {
  battle: null,
  paused: false,
  commandModeActive: false,
  selectedUnit: null,
};

// Sort du mode "Commandes" (commande donnée, annulation, ou cible invalide) : reprend le jeu.
export function exitCommandMode() {
  interactionState.commandModeActive = false;
  interactionState.selectedUnit = null;
  interactionState.paused = false;
}
