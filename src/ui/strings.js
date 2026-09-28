// Textes affichés au joueur (introduction, choix de faction, écran de bataille), regroupés pour
// une traduction future (le jeu sera en anglais à terme ; français pour l'instant).
export const TEXT = {
  // Titre du jeu, découpé pour la mise en forme ("in" plus petit, voir IntroScreen).
  title: { first: 'Sovereign', middle: 'in', last: 'War' },
  introLines: [
    'Tu es un souverain,',
    'Un être au sommet de ton espèce.',
    'Ton but ultime est de mener tes fidèles vers la grandeur.',
    'Mais en ce monde, plusieurs souverains existent.',
    'Pour atteindre ton but, il y aura la guerre.',
  ],
  start: 'Commencer',
  clickbaitVersion: 'Clickbait',

  // Messages des tutoriels (clés = champ `message` des étapes, src/data/tutorials.js).
  tutorial: {
    // Tutoriel clickbait (bataille de la version clickbait).
    clickbaitDeploy: 'Déploie tes unités pour anéantir tes ennemis.',
    clickbaitAutonomous: 'Ton unité va combattre d\'elle-même les ennemis. Certaines espèces de créatures tirent à distance, d\'autres au corps-à-corps.',
    clickbaitPresence: 'Chaque unité possède des points de présence (PP). Tu ne peux pas dépasser une présence de 150 sur le terrain. Choisis bien tes unités déployées !',

    // Tutoriel de départ (bataille 01 du jeu normal).
    deploy: 'Déploie ta 1ère unité.',
    autonomous: 'Ton unité va combattre d\'elle-même les ennemis. Certaines espèces de créatures tirent à distance, d\'autres au corps-à-corps.',
    presence: 'Chaque unité possède des points de présence (PP). Tu ne peux pas dépasser une présence de 150 sur le terrain. Choisis bien tes unités déployées !',
    openCommands: 'Si tu veux récupérer une unité blessée ou libérer de la place sur le terrain, tu peux ordonner à l\'une de tes unités de battre en retraite.',
    flee: 'Choisis une unité et ordonne-lui de battre en retraite.',

    continue: 'Continuer', // bouton commun à tous les tutoriels
  },

  chooseFaction: 'Choisis ta faction',
  factions: { wyrms: 'Wyrms', undead: 'Morts-Vivants' },

  presenceLabel: 'Présence sur le terrain',
  yourUnits: 'Vos unités',
  presenceTag: (cost) => `${cost} PP`,
  notEnoughPresence: 'Pas assez de points de présence. Libérez de la place sur le terrain pour déployer cette unité.',
  deployRefused: {
    invalidPosition: 'Déposez l\'unité sur une case libre de votre moitié du terrain.',
    presenceCapExceeded: 'Pas assez de points de présence.',
    legendaryAlreadyDeployed: 'Une seule unité légendaire à la fois sur le terrain.',
    noCopiesLeft: 'Plus aucune copie disponible.',
  },

  commands: 'Commandes',
  cancel: 'Annuler',
  orders: { move: 'Aller', attack: 'Attaquer', flee: 'Fuir' },

  pause: 'Pause (Espace)',
  resume: 'Reprendre (Espace)',

  surrender: 'Abandonner',
  surrenderTitle: 'Abandonner la bataille ?',
  surrenderDescription: 'Vos unités en réserve seront conservées.',
  surrenderCancel: 'Continuer',

  // Noms d'affichage des espèces (clé = `species.name`, identifiant anglais du code) ; une
  // espèce absente garde son nom de code.
  unitNames: {
    'Lambton Worm': 'Ver de Lambton',
  },
  keywords: {
    basic: 'basique',
    legendary: 'Légendaire',
    flying: 'Vol',
  },
};

export function unitName(species) {
  return TEXT.unitNames[species.name] ?? species.name;
}
