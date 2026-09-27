// Constantes et conversions de rendu partagées entre la Scene Phaser (champ de bataille) et la
// couche React (glisser-déposer : pixel écran -> case de grille). Ni Phaser ni React ne
// dépendent l'un de l'autre : les deux importent seulement ce fichier neutre.
// technical.md section 3 : une case de grille fait 64x64 px à l'affichage, à la résolution de
// référence (base design resolution) — celle que le Scale Manager de Phaser utilise en interne
// et vers laquelle il traduit toujours les coordonnées de pointeur, quelle que soit la taille
// CSS réelle du canevas à l'écran (technical.md 3.1).
export const CELL_SIZE = 64;
export const GRID_WIDTH = 24;
export const GRID_HEIGHT = 14;
export const GAME_WIDTH = GRID_WIDTH * CELL_SIZE; // 1536
export const GAME_HEIGHT = GRID_HEIGHT * CELL_SIZE; // 896

// Couleur d'une barre de vie selon le ratio PV/PV max — même code visuel sur le terrain
// (Phaser) et dans la tour (React), voir `cssColor`.
export function healthBarColor(ratio) {
  if (ratio > 0.5) return 0x2ecc71;
  if (ratio > 0.25) return 0xf1c40f;
  return 0xe74c3c;
}

// Couleur d'alerte des PV d'une unité blessée dans la tour : rouge au même seuil que la barre.
export function woundedHpColor(ratio) {
  return ratio > 0.25 ? 0xff9f1a : 0xe74c3c;
}

export function cssColor(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

// Centre (en px, référentiel fixe GAME_WIDTH x GAME_HEIGHT) d'un bloc de `size` x `size` cases
// dont le coin haut-gauche est la case (x, y) : une seule formule case -> pixel pour la Scene.
export function cellCenter(x, y, size = 1) {
  return { x: (x + size / 2) * CELL_SIZE, y: (y + size / 2) * CELL_SIZE };
}

// technical.md 3.1 : le canevas est affiché à une taille CSS variable (Phaser.Scale.FIT). Côté
// React (glisser-déposer), on passe par son rectangle réel à l'écran pour convertir un pixel
// écran en case. `null` tant que le canevas n'existe pas encore.
export function getCanvasRect() {
  return document.querySelector('#phaser-root canvas')?.getBoundingClientRect() ?? null;
}

export function screenToGrid(rect, clientX, clientY) {
  const scale = rect.width / GAME_WIDTH;
  return {
    x: Math.floor((clientX - rect.left) / scale / CELL_SIZE),
    y: Math.floor((clientY - rect.top) / scale / CELL_SIZE),
  };
}
