// Textes affichés au joueur (introduction, choix de faction, écran de bataille), regroupés pour
// une traduction future (le jeu sera en anglais à terme ; français pour l'instant).
export const TEXT = {
  // Titre du jeu, découpé pour la mise en forme ("in" plus petit, voir IntroScreen).
  title: { first: 'Sovereign', middle: 'in', last: 'War' },
  introLines: [
    'Tu es un souverain.',
    'Un être au sommet de ton espèce.',
    'Ton but ultime : mener tes fidèles',
    'vers la grandeur.',
    'Mais en ce monde, plusieurs souverains existent.',
    'Pour atteindre ton but, il y aura la guerre.',
  ],
  start: 'MVP',
  clickbaitVersion: 'Clickbait',

  // Messages des tutoriels (clés = champ `message` des étapes, src/data/tutorials.js).
  tutorial: {
    // Tutoriel clickbait (bataille de la version clickbait).
    clickbaitDeploy: 'Déploie tes unités pour anéantir tes ennemis.',
    clickbaitAutonomous: 'Ton unité va combattre d\'elle-même les ennemis. Certaines espèces de créatures tirent à distance, d\'autres au corps-à-corps.',
    clickbaitPresence: 'Chaque unité possède des points de présence (PP). Tu ne peux pas dépasser une présence de 150 sur le terrain. Choisis bien tes unités déployées !',
    clickbaitOpenCommands: 'Si tu veux récupérer une unité blessée ou libérer de la place sur le terrain, tu peux ordonner à l\'une de tes unités de battre en retraite.',
    clickbaitFlee: 'Choisis une unité et ordonne-lui de battre en retraite.',

    // Tutoriel de départ (bataille 01 du jeu normal).
    deploy: 'Déploie ta 1ère unité.',
    autonomous: 'Ton unité va combattre d\'elle-même les ennemis. Certaines espèces de créatures tirent à distance, d\'autres au corps-à-corps.',
    presence: 'Chaque unité possède des points de présence (PP). Tu ne peux pas dépasser une présence de 150 sur le terrain. Choisis bien tes unités déployées !',
    openCommands: 'Si tu veux récupérer une unité blessée ou libérer de la place sur le terrain, tu peux ordonner à l\'une de tes unités de battre en retraite.',
    flee: 'Choisis une unité et ordonne-lui de battre en retraite.',

    continue: 'Continuer', // bouton commun à tous les tutoriels
  },

  // Bilan de l'écran de victoire (version clickbait).
  report: {
    lost: 'Unités perdues',
    noLosses: 'Aucune perte !',
  },

  // Couche méta (rules.md 11).
  defaultArmyName: 'Armée 1', // rules.md 10 : nom de l'armée de départ
  spiritStones: (amount) => `${amount} Spirit Stones`, // nom provisoire (rules.md 11.3)
  playingAs: {
    wyrms: 'Vous jouez la Souveraine des Wyrms.',
    undead: 'Vous jouez le Souverain des Morts-Vivants.',
  },
  home: {
    goToWar: 'Partir en guerre',
    civilization: 'Gestion de civilisation',
    summon: 'Invocation',
  },
  civilization: {
    title: 'Gestion de civilisation',
    units: 'Unités',
    back: 'Retour',
    owned: (count) => `Possédés : ${count}`,
    inArmy: (count) => `Dans l'armée : ${count}`,
    stats: {
      hp: 'PV',
      damage: 'Dégâts',
      attackType: 'Attaque',
      size: 'Taille',
      moveSpeed: 'Vitesse de déplacement',
      attackSpeed: 'Vitesse d\'attaque',
      range: 'Portée',
      cost: 'Coût',
    },
    attackTypes: { melee: 'Corps-à-corps', ranged: 'À distance', hybrid: 'Hybride' },
    hybridDamage: (damage) => `${damage.ranged} (distance) / ${damage.melee} (corps-à-corps)`,
    size: (size) => (size === 1 ? '1 case' : `${size * size} cases (${size}×${size})`),
    moveSpeed: (speed) => `${formatDecimal(speed)} case/s`,
    attackSpeed: (seconds) => `${formatDecimal(seconds)} s`,
    range: (range) => (range === null ? '—' : `${range} cases`),
    abilities: 'Aptitudes',
    army: 'Armée',
    armyCost: (cost, cap) => `${cost} / ${cap} PP`,
    armyCount: (inArmy, owned) => `${inArmy} / ${owned}`,
    rename: 'Renommer',
    confirmRename: 'Valider',
    addUnit: 'Ajouter',
    removeUnit: 'Retirer',
  },
  summon: {
    title: 'Invocation',
    confirmResummon: (name, price) => `Réinvoquer ${name} pour ${price} Spirit Stones ?`,
  },
  // rules.md 11.4 : libellé du bouton d'invocation (clé = résultat de summonAction).
  summonActions: {
    summon: 'Invoquer',
    resummon: 'Réinvoquer',
    alreadyOwned: 'Déjà à vos côtés',
  },
  // Texte des aptitudes (units.md), par nom d'aptitude (`abilities[].name` du roster).
  abilityDescriptions: {
    'Attaque dévastatrice': 'Toutes les 5 attaques (distance et corps-à-corps confondus), la 5e inflige +100 % de dégâts (60 à distance / 90 au corps-à-corps).',
    'Frappe paralysante': 'Toutes les 4 attaques, la cible touchée voit sa prochaine attaque annulée.',
    'Soif de sang': 'Chaque fois qu\'il porte le coup fatal à un ennemi, il régénère 40 PV (sans dépasser ses PV max).',
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

// Nombre décimal à la française, avec au moins un chiffre après la virgule (units.md : « 1,0 s »).
function formatDecimal(n) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 1 });
}

export function unitName(species) {
  return TEXT.unitNames[species.name] ?? species.name;
}
