// Pont entre la Scene Phaser (terrain) et la tour de commandement React : ni l'un ni l'autre
// ne touche au DOM ou aux objets de l'autre (technical.md 2.2). Ils partagent seulement
// l'instance `battle` créée par battle.js, qui porte aussi tout l'état d'interaction (pauses,
// barre de commandes : voir pause.js et commandSelection.js). `null` hors de l'écran de bataille.
export const interactionState = {
  battle: null,
};
