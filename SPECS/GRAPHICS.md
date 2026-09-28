# GRAPHICS.md — Direction artistique

## Intention

**Dark fantasy rétro.** Des souverains masqués et des monstres effrayamt dessinés en pixel art, sur un champ de bataille sombre et peu engageant. L'interface reprend le même esprit avec des composants 8 bits (thème 8bitcn, `TECHNICAL.md` section 1).

Tous les assets sont **dessinés à la main**.

Principes :
- **Silhouettes lisibles** sur un fond neutre et peu contrasté
- **Une couleur signature par faction**, reprise partout : sprites, jauge de présence, projectiles.
- **Ambiance plutôt qu'effets** : le décor encadre la bataille, sans détails qui gênent la lecture de la grille.

## Palettes des factions

| Faction | Couleur signature | Tons secondaires | Utilisée pour |
|---|---|---|---|
| Souveraine des Wyrms | **doré** | rouge sombre, noir | jauge de présence, projectiles (orange) |
| Souverain des Morts-Vivants | **menthe** (vert spectral) | violet, gris ardoise | jauge de présence, projectiles (menthe) |

## Les souverains (écran de choix de faction)

| Souveraine des Wyrms | Souverain des Morts-Vivants |
|---|---|
| ![Souveraine des Wyrms](assets/wyrm_sovereign.png) | ![Souverain des Morts-Vivants](assets/undead_sovereign.png) |
| |

## Les unités

Sprites en pixel art, à 2× leur taille d'affichage : 128 × 128 px pour une unité d'une case, 256 × 256 px pour une unité 2 × 2 (`TECHNICAL.md` section 3).

| Wyrms | | Morts-Vivants | |
|---|---|---|---|
| ![Ver de Lambton](assets/lambton-worm.png) | Ver de Lambton (basique) | ![New-reborn Skeleton](assets/new-reborn-skeleton.png) | New-reborn Skeleton (basique) |
| ![Amphiptère](assets/ampiptere.png) | Amphiptère ([Vol], à distance) | ![Necromant Initiate](assets/necromant.png) | Necromant Initiate ([Vol], à distance) |
| ![Fafnir](assets/fafnir.png) | Fafnir the Cursed One ([Légendaire]) | ![Athos](assets/athos.png) | Athos the Lord of Pain ([Légendaire])|

Les unités du joueur regardent vers la droite et celles de l'IA vers la gauche : le sprite est retourné selon le camp.

## Le champ de bataille

![Champ de bataille](assets/battlefield-01.png)

Une plaine désertique, gris-beige et peu contrastée, encadrée de rochers noirs déchiquetés et de racines. Une porte éclairée à gauche marque le côté du joueur. La même image sert aux trois zones de la version clickbait ; elle est retournée horizontalement pour « Le mur » (`RULES.md` section 7.3). Ce terrain reprend le thème visuel des wyrms.

Les obstacles de la grille utilisent un seul sprite de rocher, d'autres pourront être ajoutés :

![Rocher](assets/rocks.png)

## Signaux visuels en bataille

- **Pause** : terrain désaturé ; ce qui reste cliquable garde ses couleurs (`ui-battle-screen-decisions.md` section 3).
- **Barres de vie** au-dessus des unités : vert, puis jaune sous 50 %, rouge sous 25 %.
- **Aptitudes** : « COUP CRITIQUE ! » et tremblement d'écran (Fafnir), « Raté ! » et badge 💫 (paralysie d'Athos), « +40 » en vert (Soif de sang).
