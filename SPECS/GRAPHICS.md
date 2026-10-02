# GRAPHICS.md — Direction artistique

## Intention

**Dark fantasy rétro.** Des souverains masqués et des monstres effrayamt dessinés en pixel art, sur un champ de bataille sombre et peu engageant. L'interface reprend le même esprit : composants shadcn/8bitcn (`TECHNICAL.md` section 1) habillés avec les sprites du pack **Pixel UI & HUD** (section « Interface » ci-dessous).

Tous les assets du jeu (unités, souverains, décor) sont **dessinés à la main** ; seuls les éléments d'interface viennent du pack acheté Pixel UI & HUD (Dead Revolver, itch.io).

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

## Spirit Stones (monnaie)

Icône : la **gemme violette animée** du pack Pixel UI & HUD (`assets/ui/spirit-stone.png`, 9 images de 11 × 11 px, affichée à 22 × 22 px). Elle accompagne partout le solde et les prix en Spirit Stones : en haut à droite de l'accueil, sur l'écran Invocation (`rules.md` 11.3 et 11.4).

## Spirit Fountain (accueil)

Provisoire, **sans sprite de fontaine** : un bouton « Spirit Fountain » avec l'icône des Spirit Stones, le contenu « X / capacité » et une **barre de remplissage violette** (barre RegularBarA du pack, `assets/ui/bar-*.png`). À remplacer plus tard par un sprite de fontaine (`rules.md` 11.8).

## Niveaux (joueur et individus)

Les niveaux (`rules.md` 11.5 et 11.6) reprennent la **couleur signature de la faction du joueur** (doré pour les Wyrms, menthe pour les Morts-Vivants) :
- **badge « niv X »** (bannière du pack, dorée pour les Wyrms, menthe pour les Morts-Vivants) : accordéons et page de détail de la gestion de civilisation, lignes de la tour de bataille (`ui-battle-screen-decisions.md` 2.2) ;
- **barre d'XP** : barre RegularBarA du pack, remplissage menthe (barre verte du pack) ou doré (barre orange recolorée, `assets/ui/bar-fill-wyrms.png`) ; pleine avec « MAX » au niveau 5 d'un individu ;
- **accueil** : en haut à gauche, le portrait du souverain dans un cadre en creux (Frame du pack) ; à sa droite, son nom, la barre d'XP avec « Niveau X » à côté (sans badge), et « XP / XP du niveau » en dessous.

Rien n'est ajouté sur le terrain : les unités en bataille ne montrent pas leur niveau.

## Signaux visuels en bataille

- **Pause** : terrain désaturé ; ce qui reste cliquable garde ses couleurs (`ui-battle-screen-decisions.md` section 3).
- **Barres de vie** au-dessus des unités : vert, puis jaune sous 50 %, rouge sous 25 %.
- **Aptitudes** : « COUP CRITIQUE ! » et tremblement d'écran (Fafnir), « Raté ! » et badge 💫 (paralysie d'Athos), « +40 » en vert (Soif de sang).

## Interface

Les composants React gardent leur API shadcn/8bitcn, mais leur cadre est un sprite du pack **Pixel UI & HUD**, découpé en 9-slice (`border-image`) et affiché à **2×** sans lissage (`src/components/ui/8bit/styles/pixel-ui.css`). Le pack complet reste dans `asset-packs/` (local, ignoré par git, hors build) ; seuls les fichiers utilisés sont copiés dans `assets/ui/`.

| Composant | Sprite | Comportement |
|---|---|---|
| Bouton | ButtonA (34 × 18) | Repos : liseré gris (secondaire) ou blanc (principal), rouge pour « destructive ». Survol : liseré blanc, violet pour le bouton principal. Clic : enfoncé. |
| Carte | PanelLarge noir (48 × 48) | Panneau noir à liseré gris ; le contenu passe en thème sombre. |
| Badge | Bannières (64 × 15), hauteur fixe 30 px | Liseré blanc (par défaut), gris (secondaire), doré ou menthe (niveaux, faction du joueur). |
| Barres (Spirit Fountain, XP) | RegularBarA | Violette pour la fontaine, couleur de la faction pour l'XP. |
| Portrait du souverain (accueil) | Frame noir (32 × 32) | Cadre en creux autour du sprite du souverain. |

