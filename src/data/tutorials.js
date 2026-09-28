// Statique — tutoriels, un par bataille qui en a un (technical.md 5.5). Déroulés par
// src/logic/tutorial.js (conditions, actions permises) et affichés par TutorialOverlay.jsx.
//
// Champs d'une étape :
// - id            : nom de l'étape (unique dans le tutoriel).
// - frozen        : la bataille est figée pendant l'étape.
// - allows        : actions du joueur permises (null = toutes, [] = aucune ; voir tutorial.js).
// - message       : clé du texte dans TEXT.tutorial (src/ui/strings.js), ou absent.
// - messageSeconds: durée d'affichage maximale du message (temps de bataille), ou absent.
// - continueButton: affiche [Continuer], qui ferme le message (condition `continueClicked`).
// - hand          : 1 ou 2 cibles de la main (voir HAND_TARGETS dans TutorialOverlay.jsx).
// - requires      : conditions à remplir pour ENTRER dans l'étape (toutes).
// - next          : conditions pour PASSER à l'étape suivante (une seule suffit).
// - back          : { when: condition, to: id } pour revenir à une étape précédente.

// Première bataille : déployer, combat autonome, points de présence, battre en retraite.
export const FIRST_BATTLE_TUTORIAL = [
  {
    id: 'deploy',
    frozen: true,
    allows: ['deploy'],
    message: 'deploy',
    hand: ['basicUnitRow', 'deploymentZone'],
    next: [{ type: 'playerUnitOnField' }],
  },
  {
    id: 'autonomous',
    frozen: false,
    allows: null,
    message: 'autonomous',
    messageSeconds: 3,
    continueButton: true,
    next: [{ type: 'elapsed', seconds: 8 }],
  },
  {
    id: 'presence',
    frozen: true,
    allows: [],
    message: 'presence',
    continueButton: true,
    hand: ['presenceGauge', 'basicUnitPresenceTag'],
    next: [{ type: 'continueClicked' }],
  },
  {
    // Pas de message : la bataille suit son cours jusqu'à l'avant-dernière vague de l'IA,
    // 8 s au plus.
    id: 'waitingForWave',
    frozen: false,
    allows: null,
    next: [{ type: 'enemyWaveDeployed', fromEnd: 2 }, { type: 'elapsed', seconds: 8 }],
  },
  {
    id: 'openCommands',
    frozen: true,
    allows: ['openCommandBar'],
    message: 'openCommands',
    hand: ['commandsButton'],
    // Il faut une unité à faire fuir, une barre qui peut s'ouvrir, et aucun geste en cours.
    requires: [{ type: 'playerUnitOnField' }, { type: 'commandAvailable' }, { type: 'noGestureInProgress' }],
    next: [{ type: 'commandBarOpen' }],
  },
  {
    id: 'flee',
    frozen: true,
    allows: ['order:flee', 'selectUnit:flee'],
    message: 'flee',
    hand: ['fleeOrder', 'playerUnit'],
    next: [{ type: 'commandIssued' }],
    back: { when: { type: 'commandBarClosed' }, to: 'openCommands' },
  },
];
