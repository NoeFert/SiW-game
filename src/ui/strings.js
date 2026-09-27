// Tous les textes affichés au joueur sur l'écran de bataille, regroupés pour une traduction
// future (le jeu sera en anglais à terme ; français pour l'instant).
export const TEXT = {
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
