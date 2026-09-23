// Constantes de rendu partagées entre la Scene Phaser (champ de bataille) et la sidebar React
// (conversion des coordonnées écran <-> case de grille pour le glisser-déposer). Ni Phaser ni
// React ne dépendent l'un de l'autre : les deux importent seulement ce fichier neutre.
// technical.md section 3 : une case de grille fait 64x64 px à l'affichage, à la résolution de
// référence (base design resolution) — celle que le Scale Manager de Phaser utilise en interne
// et vers laquelle il traduit toujours les coordonnées de pointeur, quelle que soit la taille
// CSS réelle du canevas à l'écran (technical.md 3.1).
export const CELL_SIZE = 64;
export const GRID_WIDTH = 24;
export const GRID_HEIGHT = 14;
export const GAME_WIDTH = GRID_WIDTH * CELL_SIZE; // 1536
export const GAME_HEIGHT = GRID_HEIGHT * CELL_SIZE; // 896
