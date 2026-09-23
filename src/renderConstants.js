// Constantes de rendu partagées entre la Scene Phaser (champ de bataille) et la sidebar React
// (conversion des coordonnées écran <-> case de grille pour le glisser-déposer). Ni Phaser ni
// React ne dépendent l'un de l'autre : les deux importent seulement ce fichier neutre.
// technical.md section 3 : une case de grille fait 64x64 px à l'affichage.
export const CELL_SIZE = 64;
