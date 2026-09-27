# UI / UX — Écran de bataille : décisions de design

Récapitulatif de la session de travail sur l'interface. Complète `rules.md`, `technical.md` et `roadmap.md`.

**Méthode de travail en deux étapes :**
1. **Description et reformulation** (étape en cours). Le designer du jeu décrit l'interface, et on vérifie qu'elle est bien comprise.
2. **Feedback et propositions d'amélioration.** Cette étape démarrera quand le designer le signalera.

**Contrainte principale :** l'interface doit être aussi simple que celle d'un jeu « clickbait ».
**Critère testable proposé :** un joueur qui voit l'écran de bataille pour la première fois comprend en 3 à 5 secondes, sans lire de texte, ce qu'il doit faire.

---

## 1. Structure générale de l'écran de bataille

```
┌────────────────┬──────────────────────────────────────┐
│ [⏸]            │                                      │  fixe
│   ( jauge )    │                                      │  fixe
│  VOS UNITÉS    │   camp du joueur  │   camp de l'IA    │
│  ┌──────────┐  │   (déploiement)   │                   │
│  │ unité    │  │                   │                   │  ↕ la liste défile
│  ├──────────┤  │        ──── sens d'attaque ───▶        │
│  │ unité    │  │                                      │
│  └──────────┘  │         CHAMP DE BATAILLE            │
│ [ COMMANDES ]  │         (canevas Phaser)             │  fixe, collé en bas
└────────────────┴──────────────────────────────────────┘
```

- **✅ À gauche : la « tour de commandement »**, une colonne où tous les éléments sont empilés verticalement.
- **À droite : le champ de bataille** (canevas Phaser).
- **✅ Le camp du joueur est sur la moitié gauche du terrain**, collée à la tour. L'IA arrive par la droite, et le joueur attaque de gauche à droite.
- **Lecture de l'écran comme une phrase :** `[ mes unités ] → [ ma zone ] → [ l'ennemi ]`, soit « je choisis → je dépose → j'attaque ».
  - Le drag de déploiement suit le sens de lecture.
  - Les trajets de souris sont courts, puisque la tour touche la zone de déploiement.
- **Modèle mental :** « À gauche, ce que **je** fais ; à droite, ce que **mes troupes** font. » Aucun bouton n'est superposé au terrain, conformément à `technical.md` : l'UI React est à côté du canevas, jamais par-dessus.

### Décisions de disposition

**Tour verticale sur le côté, plutôt qu'une barre horizontale sous le terrain.**
- Le terrain en 24:14 est limité par la hauteur sur un écran 16:9. Une barre en dessous le réduirait d'environ un tiers : ≈ 1320×770 px au lieu de ≈ 1630×950 px sur un écran 1920×1080.
- La liste d'unités défile naturellement à la molette. Un défilement horizontal est maladroit à la souris.
- Le composant d'unité (2 colonnes × 2 lignes) est pensé pour s'empiler verticalement.

**Tour à gauche, plutôt qu'à droite.**
- Attaquer de gauche à droite est une convention bien plus forte que la position d'une barre d'outils, qui varie d'un jeu à l'autre.
- L'œil commence en haut à gauche : il tombe d'abord sur les actions possibles.
- **Coût accepté :** le bouton Pause n'est pas à sa place la plus conventionnelle (en haut à droite de l'écran).

> ⏸ **✅ Bouton Pause : coin haut-droit de la tour**, collé au terrain, avec la jauge qui reste centrée.
> - Il est proche du regard du joueur : le ▶ qui pulse reste dans sa vision périphérique.
> - **Raccourci clavier : barre Espace** pour mettre en pause et reprendre.
>
> **Test rapide suggéré :** montrer la maquette 5 secondes à 3 à 5 personnes et leur demander par où elles attaquent et où sont leurs unités.

---

## 2. Tour de commandement

### 2.1 Jauge de présence (en haut)

- **Forme :** un rond qui se remplit de bas en haut, comme un liquide, selon les points de présence actuellement sur le terrain.
- **Couleur du remplissage :** la couleur principale de la faction jouée.
  - Wyrms : **doré**
  - Morts-Vivants : **menthe**
- **Ratio en chiffres** affiché par-dessus le rond, par exemple `60/150`.
- **Label** sous le rond : « Présence sur le terrain ».

### 2.2 Section « Vos unités »

Titre « Vos unités », puis **un composant par ligne**, empilés verticalement. La liste **défile** entre la jauge (fixe en haut) et le bouton Commandes (fixe en bas).

#### Composant d'unité

```
┌───────────────┬──────────────────────────────────┐
│               │ Ver de Lambton   [10 PP]          │  ligne 1 : nom + tag de présence
│  8x  [sprite] │ ♥ 40/40  ⚔ 8  [basique]           │  ligne 2 : PV + ATK + tags keyword
└───────────────┴──────────────────────────────────┘
   colonne 1              colonne 2
```

- **Colonne 1 :** le nombre de copies (format `8x`, **jamais** `8/12`) + le sprite, côte à côte.
- **Colonne 2 :**
  - **Ligne 1 :** le nom + le tag de points de présence.
  - **Ligne 2 :** les PV + l'ATK **en premier**, puis les tags de keyword.
  - **Retour à la ligne automatique** si les stats et les keywords ne tiennent pas sur une ligne (ex : Fafnir avec [Légendaire] et [Vol]).

#### Unités blessées (recommandation acceptée à l'étape 1)

- PV au format **`♥ 25/40`**, avec la valeur actuelle dans une couleur d'alerte (orange ou rouge selon la gravité).
- Les lignes intactes affichent aussi le format X/Y (`♥ 40/40`) par cohérence.
- **Mini barre de vie sous le sprite, uniquement sur les lignes d'unités blessées**, avec le même code visuel que les barres de vie au-dessus des unités sur le terrain.

```
┌───────────────┬──────────────────────────────────┐
│               │ Ver de Lambton   [10 PP]          │
│  1x  [sprite] │ ♥ 25/40  ⚔ 8  [basique]           │
│      ▓▓▓▓░░   │                                   │
└───────────────┴──────────────────────────────────┘
```

#### Règle de regroupement

Une ligne regroupe uniquement des unités **strictement identiques**. Toute différence crée une nouvelle ligne : nom, PV actuels, espèce, trait, keyword acheté, etc. Seul l'état de l'unité compte, pas son histoire.

| Cas | Résultat |
|---|---|
| Lambton qui fuit avec tous ses PV | Rejoint le groupe existant (`8x`) |
| Lambton qui fuit à 25/40 PV | Nouvelle ligne `1x` |
| Deux Lambtons qui fuient, l'un à 25 PV, l'autre à 30 PV | Deux lignes distinctes |
| Deux Lambtons qui fuient, tous les deux à 25 PV | Une ligne `2x` |
| (v2+) Lambton renommé ou avec un trait | Sa propre ligne dès le départ. Il ne fusionne qu'avec une unité ayant exactement les mêmes modifications. |

- **Ordre des lignes :** une nouvelle ligne (ex : un blessé) apparaît **juste sous son groupe d'origine**.

#### Visibilité et états

- La tour ne montre **que les unités actuellement déployables**. Une unité morte ou présente sur le terrain **disparaît** de la liste. Elle ne réapparaît que si elle fuit.
- Conséquence : la limite d'un légendaire à la fois se gère d'elle-même. Fafnir et Athos n'ont qu'une copie, donc ils ne sont plus dans la tour une fois déployés.
- **Budget de présence insuffisant :** la ligne est **grisée**.
  - Un **clic** sur une ligne grisée (y compris une tentative de drag) affiche un **tooltip au-dessus de l'unité**. Il explique la situation et suggère de libérer de la place sur le terrain.
  - Le tooltip est **purement informatif** : pas de bouton, pas d'action.
  - **Rien au survol** (hover).

#### Déploiement

- **Drag & drop depuis n'importe quel endroit du composant** vers le terrain.
- Le début du geste déclenche la pause d'interaction (voir section 3).

### 2.3 Bouton Commandes (en bas)

**Emplacement retenu :** dans la tour, **fixé en bas**, sous la liste d'unités qui défile.
L'option alternative, un bouton flottant dans un coin du champ de bataille, a été écartée pour quatre raisons :
- il cachait des cases du terrain et gênait les clics de commande ;
- il brouillait le modèle mental « tour = moi / terrain = mes troupes » ;
- il contredisait le principe « UI jamais superposée au canevas » ;
- en bas de la tour, le bouton reste de toute façon juste à côté du coin bas-gauche du terrain, dans le camp du joueur.

La barre de commandes se déroule **vers la droite**, donc en direction du terrain. C'est cohérent avec le sens de lecture de l'écran.

#### État fermé

```
[        COMMANDES        ]      ← affiche le cooldown quand il tourne
```

#### État ouvert (après un clic sur Commandes)

```
[ X ] [ ➜ ][ ⚔ ][ 🏳 ]
       Aller Attaquer Fuir
```

- Fonctionnement **type menu burger** : le **[X] remplace [Commandes] au même endroit**, et les ordres se déroulent **sur une seule ligne, vers la droite**.
- Ordres affichés sous forme d'**icônes**. Un **tooltip avec le nom de l'ordre** s'affiche **au-dessus** du bouton quand la souris reste dessus.
  - Les icônes ➜ / ⚔ / 🏳 sont provisoires, à définir.
- **[X] = Annuler**, à **n'importe quel stade** de la commande : barre ouverte, ordre choisi, unité sélectionnée. Il referme la barre et remet le bouton Commandes.
- **Ordre sélectionné :** le bouton de l'ordre choisi reste **surligné** pendant la sélection de l'unité et de la cible.

#### Cooldown

- **5 secondes** entre deux commandes (`rules.md` 5.1). Il est affiché dans le bouton Commandes.
- **Clic pendant le cooldown : rien ne se passe.**

#### Déroulé d'une commande

Dans tous les cas, le joueur **ouvre d'abord la barre** (clic sur Commandes).

```
Clic sur [COMMANDES] → la barre s'ouvre
        │
        ├─ Voie 1 (guidée, pour les novices)
        │     clic sur un ordre (Aller / Attaquer / Fuir)
        │        → clic sur une de mes unités
        │        → clic sur une case (Aller) ou un ennemi (Attaquer)
        │          (aucune cible pour Fuir)
        │
        └─ Voie 2 (raccourci, pour les joueurs expérimentés)
              clic direct sur une de mes unités (sans choisir d'ordre)
                 → clic sur un ennemi  = Attaquer
                 → clic sur une case   = Aller
              Fuir passe obligatoirement par la voie 1.
```

- Les **deux voies coexistent**. La barre d'ordres sert de rappel pour le joueur qui a oublié ce qu'il peut faire.

#### Moment de la pause d'interaction

> **Recommandation, à valider :** la pause d'interaction démarre **dès l'ouverture de la barre**, pas au choix de l'ordre.
> - Ouvrir la barre signifie « je réfléchis à un ordre » : laisser le temps courir pendant la lecture des icônes recrée du stress.
> - C'est cohérent avec le déploiement, où la pause démarre dès le début du geste.
> - Fermer avec [X] ou terminer la commande relance le temps, **sauf** si la pause principale est active.

---

## 3. Système de pause

**Décision :** donner une commande **met le jeu en pause**.

### Deux familles de pause

| | Pause d'interaction | Pause principale (bouton ⏸) |
|---|---|---|
| Déclenchement | Automatique : début d'un drag de déploiement, ouverture de la barre de commandes | Manuel, par le joueur |
| Fin | Automatique, à la fin ou à l'annulation de l'interaction | Manuelle : le joueur reclique pour reprendre |
| But | Laisser le temps d'exécuter un geste | Laisser le temps de réfléchir et de planifier |
| Pendant cette pause | Seulement l'interaction en cours | Déployer et commander restent possibles |

### Règles de la pause principale

- **Bouton unique ⏸ / ▶** : un interrupteur, **pas un menu modal**, car le joueur doit pouvoir agir sur le terrain et la tour pendant la pause.
- **Tous les compteurs sont gelés** : cooldown des commandes, timers d'attaque, script de l'IA, compte à rebours de 15 s.
- Le cooldown étant gelé, le joueur ne peut donner **qu'une seule commande** par pause.
- **Intention :** laisser aux joueurs plus lents le temps de réfléchir et d'élaborer leur stratégie si le combat va trop vite, pour éviter un stress constant et l'abandon du jeu par frustration.

> **Hypothèses à confirmer :**
> - Le joueur peut déployer **plusieurs** unités pendant la pause principale (le déploiement n'a pas de cooldown, seulement le budget de présence).
> - Après un déploiement ou une commande, le jeu **reste en pause** jusqu'à ce que le joueur reclique sur ▶.

### Signal visuel de la pause principale : propositions

Contrainte : pendant la pause, le terrain doit rester entièrement visible et cliquable.

| | Proposition | Points forts | Limites |
|---|---|---|---|
| A | Terrain désaturé (couleurs ternes) | Signal immédiat « temps figé », ne cache rien | Les unités doivent rester lisibles |
| B | Bandeau « PAUSE » fin en haut du terrain | Explicite | Du texte ; cache une ligne de cases |
| C | Cadre coloré autour du canevas | Discret, ne cache rien | Trop subtil seul |
| D | Bouton ⏸ transformé en ▶ qui pulse | Montre l'état et comment en sortir | Demande de regarder la tour |
| E | Animations des sprites gelées | Naturel, découle du gel du jeu | Peu visible si rien ne bougeait |

- **✅ Choix retenu : A + D.**
  - Le terrain est désaturé pendant la pause principale.
  - Le bouton ⏸ devient un ▶ qui pulse doucement dans la tour.
  - Le gel des animations (E) vient de lui-même avec le gel du jeu.
- **Pauses d'interaction : ✅ désaturation partielle, avec les éléments sur lesquels le joueur peut agir qui restent en couleur.** La désaturation signale la pause **et** montre où cliquer.

| Situation | Terrain | Reste en couleur |
|---|---|---|
| Pause principale | Désaturation complète + ▶ qui pulse | Rien de particulier |
| Déploiement (drag) | Désaturation partielle | La zone de déploiement du joueur |
| Commande : choix de l'unité | Désaturation partielle | Les unités du joueur |
| Commande : choix de la cible | Désaturation partielle | Les ennemis (Attaquer) ou les cases accessibles (Aller) |

- **Règle simple pour le joueur :** ce qui est en couleur est cliquable.
- **Les deux pauses se combinent :** une interaction pendant la pause principale garde la désaturation complète, et seuls les éléments valides reprennent leur couleur.

---

## 4. Bouton Abandonner

- **Disponible en permanence**, **y compris pendant la bataille tutoriel**. La v1 est une bêta, et toutes les fonctionnalités doivent pouvoir être testées.
- L'abandon entraîne une défaite. Les unités en réserve ne sont pas exterminées (`rules.md` 8.2).
- Une **confirmation** avant d'abandonner a été proposée, par exemple : « Abandonner la bataille ? Vos unités en réserve seront conservées. »
- **Emplacement : non tranché.** La première idée (dans un menu de pause modal) a été retirée, car la pause principale n'ouvre pas de menu.

---

## 5. Incohérences à corriger dans les specs

- **`rules.md` section 5** dit que donner une commande **ne met pas** le jeu en pause. À corriger : la commande **met le jeu en pause** (déjà cohérent avec `roadmap.md` et `technical.md`).
- **`rules.md` section 5.1**, cooldown : à préciser que le cooldown ne s'écoule pas pendant les pauses.
- **Pause principale :** nouvelle mécanique, absente de `rules.md`, `roadmap.md` et `technical.md`. À ajouter, avec le gel de tous les compteurs.
- **Bouton Abandonner :** absent de `technical.md` section 2.2 (liste des éléments React). À ajouter.
- **Tutoriel (`technical.md` 6.2, étapes 3 et 4) :** à réaligner sur le nouveau déroulé de commande (barre qui se déroule, [X], Fuir via la barre uniquement).
- **Mineur, relevé en passant :** `rules.md` 7.1 donne 155 / 147 points pour les scripts IA, alors que `rules.md` 9 et `units.md` annoncent un budget de 150 par camp.

---

## 6. Reste à décrire (étape 1)

- **Emplacement du bouton Abandonner.**
- **Champ de bataille** :
  - barres de vie ;
  - distinction visuelle entre les deux camps ;
  - zone de déploiement (moitié joueur) pendant un drag ;
  - retour visuel de la sélection d'unité et de cible pendant une commande ;
  - feedback des aptitudes (Attaque dévastatrice de Fafnir, Frappe paralysante et Soif de sang d'Athos) ;
  - unité en fuite ;
  - unité engagée au corps-à-corps.
- **Compte à rebours de 15 s** (terrain vide avec réserves) : où et comment il s'affiche.
- **Overlay tutoriel « la main »** : intégration avec la tour et la barre de commandes.
- **Les autres écrans** : choix de faction, victoire, défaite, accueil, gestion de civilisation.
