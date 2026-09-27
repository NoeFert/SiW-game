// Statique — sprite de chaque espèce (par `species.name`), partagé par la Scene Phaser et la
// tour de commandement React. `facing` : direction dans laquelle regarde le dessin d'origine
// ('right', 'left', ou null pour un sprite de face), pour le retourner selon le camp : le
// joueur attaque vers la droite, l'IA vers la gauche (rules.md 2).
export const SPECIES_SPRITES = {
  'Lambton Worm': { key: 'lambton-worm', facing: 'right' },
  Amphiptère: { key: 'ampiptere', facing: 'right' },
  'Fafnir the Cursed One': { key: 'fafnir', facing: 'right' },
  'New-reborn Skeleton': { key: 'new-reborn-skeleton', facing: 'left' },
  'Necromant Initiate': { key: 'necromant', facing: 'left' },
  'Athos the Lord of Pain': { key: 'athos', facing: null },
};

// Chemin servi par Vite (publicDir = assets/).
export function spritePath(key) {
  return `sprites/${key}.png`;
}
