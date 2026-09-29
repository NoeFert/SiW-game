# TECHNICAL.md

Les technologies choisies, pourquoi, et la stratégie de tests. Ce fichier couvre le **comment** — pour le **quoi** (comportement du jeu), voir `rules.md` et `units.md`.

---

## 1. Langage et moteur

| Choix | Techno | Pourquoi |
|---|---|---|
| Langage | **JavaScript** | Choix simple pour démarrer rapidement, sans la charge d'un système de types à maintenir pour un prototype v1 |
| Moteur de jeu (champ de bataille) | **Phaser 3** (pas Phaser 4) | Phaser 4 est la version activement maintenue depuis avril 2026, mais trop récente pour être bien couverte par les connaissances des outils d'IA utilisés pour coder ce projet (Claude Code). Phaser 3, bien que figé (dernière version 3.90.0, plus de nouvelles fonctionnalités), reste stable et dispose d'une documentation et d'exemples massifs — un agent IA le connaît en profondeur et se trompe moins. Une migration vers Phaser 4 reste possible plus tard, une fois son écosystème plus mature |
| UI hors champ de bataille | **React + Tailwind CSS + shadcn/ui (thème 8bitcn)** | Phaser est peu adapté à construire de l'UI HTML classique (listes, boutons, panneaux). Tout ce qui n'est pas un asset de jeu dessiné à la main (sprites, backgrounds) — boutons, sidebar de déploiement, HUD, écrans de fin de bataille — passe par des composants génériques React plutôt que d'être recréé à la main en CSS. Le thème 8bitcn colle en plus à l'identité visuelle rétro du jeu. Installation des composants via `npx shadcn@latest add @8bitcn/<component>` |
| Bundler | **Vite** | Standard actuel pour les projets Phaser modernes, démarrage et rechargement à chaud rapides ; le plugin React de Vite permet de faire cohabiter Phaser et React sans friction |
| Gestionnaire de paquets | npm | Par défaut avec Node.js, pas de raison de s'en écarter pour ce projet |

---

## 2. Architecture : séparation logique / rendu

**Principe central : la logique du jeu ne dépend jamais de Phaser, ni de React.**

- Le **moteur de bataille** (grille, unités, pathfinding, résolution de combat, conditions de victoire/défaite) est écrit en JavaScript pur, sans aucun import de Phaser ni de React — un module autonome qui pourrait fonctionner en ligne de commande, sans navigateur ni rendu graphique
- La **couche Phaser** (Scenes, Sprites, input sur le champ de bataille) est une couche fine par-dessus : elle lit l'état produit par la logique de jeu et l'affiche, elle transmet les clics du joueur sur le terrain vers la logique de jeu, mais ne contient elle-même aucune règle de jeu
- La **couche React** (sidebar de déploiement, boutons, HUD, écrans de fin de bataille) suit le même principe : elle lit l'état produit par la logique de jeu et affiche des composants shadcn/8bitcn génériques, sans contenir de règle de jeu elle-même

- La **logique méta** (individus possédés, armée, Spirit Stones, invocation — `rules.md` section 11) suit la même séparation : ses règles vivent dans `src/logic/` en JavaScript pur, un fichier par domaine — `ownedUnits.js` (individus possédés, dotation, pertes), `army.js` (armée), `summon.js` (invocation), `levels.js` (niveaux du joueur et des individus), `victory.js` (ce que change une victoire : pertes, XP, armée de départ) —, jamais dans les composants React. `persistence.js` se contente de lire et d'écrire le localStorage, sans aucune règle de jeu

**Pourquoi :** ça permet de tester toute la logique de combat/mouvement avec des tests automatisés rapides, sans avoir besoin de lancer le jeu dans un navigateur — essentiel pour la stratégie de tests ci-dessous. Ça garde aussi la porte ouverte à changer le moteur de rendu ou le framework d'UI plus tard sans toucher aux règles du jeu.

### 2.1 Style de modélisation des données
- **Entités avec comportement et état évolutif** (une unité déployée, la bataille en cours) : modélisées comme des classes ES6 porteuses à la fois de données et de comportement (ex : `Unit`, `Battle`)
- **Configuration statique sans comportement propre** (définitions d'espèces/stats de base, scripts de bataille IA, configuration de grille) : objets JavaScript simples, potentiellement externalisables en JSON, séparés du comportement
- Une unité déployée **référence** sa définition d'espèce statique plutôt que de dupliquer ses stats de base — voir le détail dans `units.md`

### 2.2 Répartition Phaser / React

- **Phaser gère exclusivement le champ de bataille** : le canevas de jeu (grille, sprites d'unités, background, animations de combat, barres de vie au-dessus des unités, feedback visuel des aptitudes)
- **React + shadcn/8bitcn gèrent tout le reste de l'interface** : la **tour de commandement** de l'écran de bataille (voir ci-dessous), l'écran de choix de faction, les écrans de fin de bataille (récompense, défaite), l'écran d'accueil, l'écran de gestion de civilisation, l'écran d'invocation, le compte à rebours de 15 secondes
- **Tour de commandement** (`src/ui/CommandTower.jsx`, détail dans `SPECS/ui-battle-screen-decisions.md`) : colonne **à gauche** du canevas, collée à la zone de déploiement du joueur. De haut en bas : bouton **Pause** (interrupteur ⏸ / ▶ de la pause principale, coin haut-droit, raccourci Espace), bouton **Abandonner** (emplacement provisoire à côté de Pause, avec boîte de confirmation), jauge de présence, liste « Vos unités » (seule zone qui défile, lignes regroupées par unités strictement identiques, drag & drop vers le terrain), **barre de commandes** fixée en bas (bouton « Commandes » avec cooldown, qui se déroule en [X] + icônes Aller / Attaquer / Fuir)
- Le canevas Phaser et l'arbre React vivent côte à côte dans la page quand la bataille est affichée (la tour est **à côté** du champ de bataille, jamais superposée — seuls les tooltips, la confirmation d'abandon et le futur overlay tutoriel peuvent passer par-dessus) ; aucun des deux ne manipule directement le DOM ou les objets de l'autre — ils communiquent uniquement via l'état partagé exposé par `battle.js`. Toutes les règles d'interaction (pauses, déroulé d'une commande, contenu de la liste d'unités) vivent dans `src/logic/` (`pause.js`, `commandSelection.js`, `deployment.js`) ; React et Phaser ne font que lire l'état et transmettre les actions du joueur
- **Signaux de pause sur le terrain** (Phaser) : désaturation complète pendant la pause principale, partielle pendant une pause d'interaction ; ce qui est cliquable (zone de déploiement, unités du joueur, ennemis ou cases ciblables) reste en couleur
- Les autres écrans (choix de faction, récompense, défaite, accueil, gestion de civilisation — voir section 5) sont du **React pur, sans Phaser** : le canevas de jeu n'existe que pendant l'écran de bataille
- Largeur de la tour : laissée à l'appréciation de l'implémentation, à ajuster si besoin une fois affichée

### 2.3 Structure de dossiers indicative

```
src/
  logic/           # Moteur de bataille, sans dépendance à Phaser ni à React
    grid.js
    unit.js
    combat.js
    pathfinding.js
    deployment.js
    battle.js
    ownedUnits.js  # Couche méta (rules.md 11) : individus possédés
    army.js        #   armée
    summon.js      #   invocation
    levels.js      #   niveaux du joueur et des individus
    victory.js     #   conséquences d'une victoire (pertes, XP, armée)
  data/            # Configuration statique (rosters, scripts IA)
    wyrmsRoster.js
    undeadRoster.js
    battleScript.js
  scenes/          # Couche Phaser (rendu du champ de bataille, input sur le terrain)
    BattleScene.js
  ui/              # Couche React (sidebar, boutons, HUD, écrans)
    screens/       # Les 8 écrans du jeu (voir section 5)
      IntroScreen.jsx
      FactionChoiceScreen.jsx
      BattleScreen.jsx
      VictoryScreen.jsx
      DefeatScreen.jsx
      HomeScreen.jsx
      CivilizationScreen.jsx
      SummonScreen.jsx
    CommandTower.jsx
    DeploymentList.jsx
    CommandBar.jsx
    components/    # Composants shadcn/8bitcn générés (ex: button.jsx)
  App.jsx          # État de navigation entre écrans (voir section 5)
assets/
  sprites/
    fafnir.png
    athos.png
    lambton-worm.png
    new-reborn-skeleton.png
  backgrounds/
    battlefield-01.png
tests/
  logic/           # Tests automatisés de la logique de jeu
    combat.test.js
    pathfinding.test.js
    battle.test.js
    deployment.test.js
```

*Structure indicative, à ajuster librement en cours de développement — ce qui compte est la séparation `logic/` (sans Phaser ni React) vs `scenes/` (Phaser) vs `ui/` (React).*

### 2.4 Convention de nommage
- **Le code, les noms de fichiers, les dossiers et les assets utilisent des noms anglais**, même si les documents `SPECS/` restent rédigés en français (ce sont des outils de travail, pas une source de texte à afficher tel quel). Les textes affichés au joueur sont en français pour le Rendu 1, regroupés dans `src/ui/strings.js` pour une traduction future
- Ex : la classe `Unit`, le fichier `combat.js`, le sprite `lambton-worm.png` — pas de noms français dans le code

### 2.5 Principe pour la v1 : DRY et simplicité maximale
- Priorité à un code **simple et sans répétition (DRY)** plutôt qu'à une architecture élaborée pensée pour anticiper la v2+
- Pas d'abstraction prématurée (pas de système de plugins, pas de couche de configuration générique) tant qu'un besoin concret ne l'exige pas
- Objectif : le code le plus direct possible pour valider le moteur de bataille, quitte à le retravailler une fois la v1 jouable et testée

## 3. Résolution de rendu

- **Taille d'une case de grille : 64×64 pixels.** Avec la grille de 24×14 cases (`rules.md` section 1), le canevas de jeu Phaser fait **1536×896 pixels** à sa taille de référence (base design resolution).
- **Résolution des assets fournis : 2x la taille d'affichage réelle**, pour rester net sur les écrans haute densité (Retina) — Phaser réduit à l'affichage.
  - Sprites 1 case (Lambton Worm, New-reborn Skeleton, et futurs Amphiptère/Necromant Initiate) : 128×128 px, PNG avec transparence
  - Sprites 4 cases / 2×2 (Fafnir, Athos) : 256×256 px, PNG avec transparence
  - Background de bataille : 3072×1792 px si possible (2x du canevas), sinon 1536×896 px minimum, PNG ou JPG
- Le DPI des fichiers n'a aucune incidence sur le rendu à l'écran — seule la taille en pixels compte.

### 3.1 Adaptation à la taille d'écran (desktop uniquement)

- **Le jeu s'adapte à la taille de la fenêtre du navigateur, desktop uniquement** — pas de layout mobile/tactile à prévoir pour la v1.
- **Le canevas Phaser garde toujours son ratio d'aspect (24:14)** : il ne s'étire jamais de façon à déformer la grille ou les sprites. Utiliser le Scale Manager de Phaser en mode `Phaser.Scale.FIT` avec un parent redimensionnable (`Phaser.Scale.RESIZE` sur le conteneur, ou écoute de `resize` window + `scale.resize()`), pour que le canevas grandisse ou rétrécisse en conservant ses proportions.
- **La tour de commandement React s'adapte plus librement** autour du canevas (largeur en `%` ou `rem`, pas de ratio imposé), tant qu'elle reste entièrement visible à côté du terrain, jamais superposée ni coupée.
- **Taille de fenêtre minimale** : définir une largeur/hauteur minimale raisonnable (ex : 1280×720) en dessous de laquelle le jeu n'essaie pas de rétrécir davantage (scroll ou simple troncature du surplus plutôt que des éléments illisibles) — pas de vraie réflexion "petit écran" nécessaire pour la v1, desktop uniquement.
- Les positions de jeu (grille, coordonnées d'unités) restent exprimées dans le référentiel fixe de 1536×896 dans `src/logic/` — seule la couche Phaser convertit vers la taille d'affichage réelle au moment du rendu ; aucune règle de `rules.md` ne dépend de la résolution d'écran.

---

## 4. Stratégie de tests

- **Tests automatisés dès la v1**, avec **Jest**, ciblant exclusivement le dossier `logic/` (la logique de jeu indépendante de Phaser et de React)
- Priorité de couverture :
  1. Résolution de combat (dégâts simultanés, mort, aptitudes automatiques)
  2. Pathfinding (chemin le plus court, contournement d'obstacles, blocs 2×2, unités [Vol])
  3. Règles d'engagement au corps-à-corps (redirection vers un autre ennemi, file d'attente)
  4. Conditions de fin de bataille (victoire immédiate, cas d'égalité, compte à rebours de 15s)
  5. Gestion des points de présence et des copies (plafond vivant, copie perdue vs réutilisable)
  6. Couche méta (`rules.md` 11) : plafond de 500 PP et minimum d'1 individu de l'armée, retrait des morts de la liste et de l'armée, prix d'invocation, [Légendaire] unique, solde insuffisant, validation du nom de l'armée
  7. Niveaux (`rules.md` 11.5 et 11.6) : courbes d'XP du joueur et des individus, plafond du niveau 5, stats par niveau et leur arrondi, XP gagnée à la victoire (survie, coups fatals, coup fatal simultané, bonus de survivants), récompenses de niveau, prix du niveau gardé à la réinvocation
- **Pas de tests automatisés sur la couche Phaser ni sur la couche React** (rendu, animations, input, composants UI) pour la v1 — cette partie reste validée manuellement en jouant, le coût de mise en place de tests d'interface n'étant pas justifié pour un prototype
- Chaque règle chiffrée de `rules.md` doit pouvoir correspondre à au moins un test automatisé qui la vérifie — cohérent avec la consigne de `rules.md` ("chaque ligne doit être vérifiable")

---

## 5. Écrans et navigation

Le jeu v1 est composé de **huit écrans distincts**. Un seul d'entre eux (l'écran de bataille) contient le canevas Phaser ; les sept autres sont du React pur.

### 5.1 Liste des écrans

0. **IntroScreen** — texte d'introduction centré (le joueur est un souverain qui devra mener les siens à la guerre), avec un bouton pour continuer. Affiché juste avant `FactionChoiceScreen`, donc **une seule fois**, au tout début d'une partie.
1. **FactionChoiceScreen** — écran de choix de faction (Souveraine des Wyrms ou Souverain des Morts-Vivants). Affiché **une seule fois**, au tout début d'une partie (pas avant chaque bataille, même une fois que plusieurs batailles existeront en v2+).
2. **BattleScreen** — l'écran de bataille actuel : tour de commandement React à gauche (pause, abandon, déploiement, commandes) + canevas Phaser (champ de bataille) à droite.
3. **VictoryScreen** — écran de récompense affiché après une victoire. **Squelette minimal pour la v1** (voir 5.3). La victoire rapporte des Spirit Stones (`rules.md` 11.3) ; montant et affichage de cette récompense à définir (`roadmap-mvp.md`). Dans le jeu normal, il affiche l'**XP gagnée par le joueur** (`rules.md` 11.5).
4. **DefeatScreen** — écran affiché après une défaite, avec un bouton **"Réessayer"** qui relance la même bataille (la faction déjà choisie reste conservée, aucun nouveau choix de faction demandé). Sert aussi après un match nul (`rules.md` 8.1), avec le titre « Match nul » au lieu de « Défaite » : même suite, aucun vainqueur.
5. **HomeScreen** — écran d'accueil, point central du jeu. **Accessible uniquement après avoir remporté la première bataille** (traitée comme la bataille tutoriel). Affiche la faction choisie par le joueur (ex : "Vous jouez la Souveraine des Wyrms."), le **solde de Spirit Stones** en haut à droite (`rules.md` 11.3), le **niveau du joueur et sa barre d'XP** près du solde (`rules.md` 11.5), et trois boutons : **Partir en guerre** (désactivé tant que son contenu n'est pas spécifié, `roadmap-mvp.md`), **Gestion de civilisation** (`CivilizationScreen`) et **Invocation** (`SummonScreen`).
6. **CivilizationScreen** — écran de gestion de civilisation, accessible depuis `HomeScreen`, en deux sections :
   - **Unités** : un **accordéon par espèce** du roster de la faction du joueur. En-tête : sprite, nom, keywords, coût en PP, nombre d'individus possédés ; une espèce à 0 reste affichée, grisée, avec son bouton « Invoquer » / « Réinvoquer » vers `SummonScreen`. Ouvert : un individu par ligne (niveau, barre d'XP, présent dans l'armée ou non). Un clic sur un individu ouvre la **page de détail de l'individu** (vue interne à l'écran, pas un écran à part) : grand sprite, nom de l'espèce, keywords, niveau et barre d'XP, présence dans l'armée, stats complètes **à son niveau** (`rules.md` 11.6), texte des aptitudes, bouton « Invoquer » / « Réinvoquer » de son espèce vers `SummonScreen`.
   - **Armée** : nom modifiable, compteur « X / 500 PP », et un **accordéon par espèce** — fermé, un résumé seul (« 7 / 9 dans l'armée ») ; ouvert, un individu par ligne (niveau, barre d'XP) avec une case « dans l'armée » à cocher / décocher (`rules.md` 11.2).
   - Dans un accordéon ouvert (Unités comme Armée), les individus sont triés par **niveau décroissant, puis XP décroissante** : les vétérans en haut.
   - Au niveau 5 (maximum, `rules.md` 11.6), la barre d'XP d'un individu est pleine et affiche **« MAX »** au lieu de « X / Y XP » (provisoire, voir la Suite de `roadmap-mvp.md`).
7. **SummonScreen** — écran d'invocation, accessible depuis `HomeScreen` et depuis la page de détail d'une espèce. Une ligne par espèce de la faction du joueur, avec son prix en Spirit Stones et un bouton « Invoquer » (« Réinvoquer » pour un [Légendaire] mort, désactivé avec « Déjà à vos côtés » tant qu'il est vivant, désactivé aussi si le solde est insuffisant) — `rules.md` 11.4. La boîte de confirmation de « Réinvoquer » propose le **niveau gardé** (de 1 au niveau du [Légendaire] à sa mort) et affiche le prix correspondant. Solde affiché comme sur `HomeScreen`.

### 5.2 Enchaînement (v1)

```
IntroScreen → FactionChoiceScreen (une fois)
        │
        ▼
   BattleScreen ──────► DefeatScreen ──"Réessayer"──┐
        │                                             │
     victoire                                         │
        │                                             │
        ▼                                             │
  VictoryScreen                                        │
        │                                              │
        ▼                                              │
   HomeScreen ◄────────────────────────────────────────┘ (après la victoire)
     ├──► CivilizationScreen (Unités / détail d'une espèce / Armée) ──► retour HomeScreen
     │         └── « Invoquer » depuis le détail ──► SummonScreen
     ├──► SummonScreen ──► retour HomeScreen
     └──► « Partir en guerre » (désactivé, contenu à spécifier)
```

« Réessayer » sur `DefeatScreen` relance `BattleScreen`.

- **Rendu 1 (POC) :** seule la version clickbait (5.6) est jouable. Sur `IntroScreen`, le bouton du jeu normal s'appelle « MVP » et il est grisé ; l'application démarre toujours sur `IntroScreen`, quelle que soit la sauvegarde (`MVP_LOCKED` dans `App.jsx`, à passer à `false` pour rouvrir le MVP). La règle ci-dessous s'applique une fois le MVP rouvert.
- Au chargement de l'application, l'état persistant (localStorage, voir 5.4) est lu : s'il n'y a pas encore de faction choisie, `IntroScreen` s'affiche, puis `FactionChoiceScreen` ; si une faction est déjà choisie mais la première bataille pas encore gagnée, l'app va directement à `BattleScreen` ; si la première bataille est déjà gagnée, l'app va directement à `HomeScreen`.
- Une défaite ne fait perdre ni la faction choisie ni aucune autre donnée persistée — seul un nouvel essai de la même bataille est proposé, et aucune perte d'unité d'une tentative ratée n'est comptabilisée (voir 5.4).

### 5.3 Squelette de VictoryScreen et DefeatScreen pour la v1
- Les deux écrans sont volontairement minimaux : un titre (Victoire / Défaite ou Match nul), et un seul bouton d'action (Continuer vers l'accueil / Réessayer)
- **Victoire dans le jeu normal** : entre le titre et le bouton, deux blocs de niveaux (`rules.md` 11.5 et 11.6) :
  - l'**XP gagnée par le joueur** (« +X XP ») ;
  - les **individus qui ont gagné au moins un niveau** pendant la bataille, regroupés par espèce et par passage de niveau, au format du bilan des pertes (ex : « 2x [sprite] Ver de Lambton niv 1 → 2 »). Bloc absent si aucun individu n'a monté de niveau.
- **Version clickbait : aucun changement** — elle garde son bilan des pertes (5.6), sans XP ni niveau.
- L'affichage de la récompense en Spirit Stones reste à définir (`roadmap-mvp.md`) — la structure du composant doit être prête à accueillir ce contenu sans réécriture complète

### 5.4 Navigation et état persistant
- **Gestion de la navigation entre écrans : état React simple** (ex : un state `currentScreen` géré dans le composant racine `App.jsx`), pas de librairie de routing (React Router ou équivalent) pour la v1 — le jeu est une session continue dans un seul onglet, sans besoin d'URLs distinctes par écran. Une vraie solution de routing pourra être introduite en v2+ si la sélection de niveau (plusieurs batailles) le justifie.
- **Persistance via localStorage** : sept valeurs sont sauvegardées (`roadmap-mvp.md`) —
  1. la faction choisie par le joueur
  2. un indicateur booléen "première bataille (tutoriel) gagnée"
  3. la **liste des individus possédés**, chacun `{ id, species, xp }` (ex : `[{ id: 'u1', species: 'lambtonWorm', xp: 0 }, …]`, `rules.md` 11.1 et 11.6 ; le niveau se calcule à partir de l'XP, il n'est pas sauvegardé) : créée avec la dotation de départ au choix de la faction, mise à jour à chaque victoire (individus tués retirés, XP gagnée) et à chaque invocation — jamais lors d'une tentative ratée (voir 5.2). Elle remplace l'ancien décompte de copies par espèce
  4. l'**armée** : `{ name, unitIds }` (`rules.md` 11.2)
  5. le **solde de Spirit Stones** (entier, `rules.md` 11.3)
  6. l'**XP du joueur** (entier, `rules.md` 11.5 ; le niveau se calcule à partir de l'XP)
  7. le **niveau du [Légendaire] à sa mort** (entier, ou absent s'il n'est jamais mort ; `rules.md` 11.4), mis à jour à chaque mort du [Légendaire] à la victoire
- **Identifiant d'un individu** : généré par `crypto.randomUUID()` à sa création (dotation de départ ou invocation). Jamais dérivé de la taille de la liste, qui réutiliserait l'identifiant d'un individu mort ; aucun compteur n'est sauvegardé.
- Aucun champ de personnalisation n'est ajouté aux individus : l'identifiant suffit pour que les armées référencent des individus, et pour accueillir la personnalisation plus tard sans migration de sauvegarde.
- C'est une exception ciblée à l'absence de persistance, pas un système de sauvegarde généralisé. Ces valeurs suffisent à reconstituer l'écran de départ correct au chargement de l'application (voir 5.2) et à afficher `HomeScreen`, `CivilizationScreen` et `SummonScreen`.
- **Individus sauvegardés sans `xp`** (sauvegardes antérieures aux niveaux) : pas de migration, un individu sans `xp` compte comme 0 XP (niveau 1) ; un joueur sans XP sauvegardée est à 0 XP.
- **Ancien format (décompte de copies par espèce) : pas de migration.** Une sauvegarde qui contient une faction mais pas de liste d'individus est considérée comme absente : elle est effacée et l'app repart de `IntroScreen`. Aucun joueur n'a de sauvegarde MVP (le build publié ne donne accès qu'au clickbait, qui ne sauvegarde rien).
- Le raccourci « restart game » du menu devs (section 5.7) efface toutes ces valeurs et ramène à `IntroScreen`. Il n'y a plus de bouton de réinitialisation côté joueur.
- Aucune autre donnée n'est persistée en v1 (l'état d'une bataille en cours, par exemple, repart de zéro à chaque chargement de `BattleScreen`).

### 5.5 Tutoriels
- **Un tutoriel est rattaché à une bataille**, pas au joueur : chaque bataille est décrite dans `src/data/battles.js` (identifiant, scripts IA, tutoriel éventuel), et `BattleScreen` reçoit l'identifiant de la bataille à jouer. La bataille 01 du jeu normal (`firstBattle`) a le tutoriel de départ, la bataille-clickbait (`clickbaitBattle`, section 5.6) le tutoriel clickbait ; un tutoriel se rejoue à chaque « Réessayer » après une défaite ou un match nul.
- **Le contenu d'un tutoriel est une donnée** (`src/data/tutorials.js`) : une liste d'étapes (message, cibles de la main, gel, actions permises, conditions d'entrée et de passage). Le moteur (`src/logic/tutorial.js`) et l'affichage (`src/ui/TutorialOverlay.jsx`) sont communs à toutes les batailles : un nouveau tutoriel s'écrit sans toucher au code, tant qu'il réutilise les conditions et les cibles de main existantes.
- **Chaque étape qui demande ou explique quelque chose fige la bataille** (tous les compteurs gelés, comme une pause, `rules.md` 5.2) et **n'autorise que l'action demandée**. Le bouton Pause est alors désactivé ; le bouton Abandonner reste toujours disponible (`rules.md` 8.2).
- Chaque étape affiche un **message** (composant `Item` 8bitcn, en haut du terrain) et une **main** qui montre l'action à faire. C'est le seul overlay autorisé par-dessus le terrain avec les tooltips (section 2.2).
- **Tutoriels existants** (`src/data/tutorials.js`) :
  - `CLICKBAIT_TUTORIAL` — **sur la bataille-clickbait** (section 5.6). Tutoriel indépendant (ses propres étapes et textes, clés `clickbait…` dans `strings.js`), appelé à évoluer. Pour l'instant : déployer, combat autonome, points de présence, battre en retraite (étapes 1, 1 suite, 2, 3 et 3 suite ci-dessous), puis fin du tutoriel. Différences avec le tutoriel de départ : l'étape des points de présence est **autonome** — elle ne fige pas la bataille, n'attend aucune action, et son message disparaît seul après 6 s (ou plus tôt avec [Continuer]) ; l'étape 3 se déclenche **6 s (temps de bataille) après le début de la phase 2** (« Le mur », `rules.md` 7.3 — la transition entre phases, figée, ne compte pas), avec les mêmes conditions d'entrée que dans le tutoriel de départ (voir « Déclenchement de l'étape 3 » ci-dessous) : tant qu'elles ne sont pas réunies, l'étape attend. Textes identiques au tutoriel de départ pour l'instant.
  - `STARTER_TUTORIAL` — tutoriel de départ, **sur la bataille 01 du jeu normal**. Son déroulé complet :

| Étape | Message | Main | Bataille | Suite |
|---|---|---|---|---|
| 1 | « Déploie ta 1ère unité. » | Allers-retours entre l'unité basique (Lambton / Skeleton) et la zone de déploiement | Figée (seul le déploiement est permis) | Le joueur déploie sa première unité |
| 1 (suite) | « Ton unité va combattre d'elle-même les ennemis. Certaines espèces de créatures tirent à distance, d'autres au corps-à-corps. » + [Continuer] | — | **En cours** : le joueur voit son unité se battre | Le message disparaît après 3 s au plus (ou au clic sur [Continuer]) ; l'étape 2 arrive 8 s (temps de bataille) après le début de l'étape |
| 2 | « Chaque unité possède des points de présence (PP). Tu ne peux pas dépasser une présence de 150 sur le terrain. Choisis bien tes unités déployées ! » + [Continuer] | Allers-retours entre la jauge de présence et le tag PP de l'unité basique | Figée | Clic sur [Continuer] ; la bataille reprend normalement |
| 3 | « Si tu veux récupérer une unité blessée ou libérer de la place sur le terrain, tu peux ordonner à l'une de tes unités de battre en retraite. » | Tapote le bouton Commandes | Figée (seule l'ouverture de la barre est permise) | Le joueur ouvre la barre de commandes |
| 3 (suite) | « Choisis une unité et ordonne-lui de battre en retraite. » | Allers-retours entre l'icône Fuir et une unité du joueur | Figée (seuls Fuir et le choix d'une unité sont permis) | L'ordre de fuite est donné : fin du tutoriel. Refermer la barre avec [X] ramène à l'étape 3 |

- **Déclenchement de l'étape 3** : quand l'IA a déployé son **avant-dernière vague** (avant-dernière entrée de son script, `rules.md` 7.1 — t=28 s) **ou au plus tard 8 s** (temps de bataille) après la fin de l'étape 2, au premier des deux ; dans les deux cas, dès que le joueur a au moins une unité sur le terrain, que la barre de commandes peut s'ouvrir (pas de cooldown en cours) et qu'aucun geste n'est en cours.

### 5.6 Version clickbait
- Version du jeu **indépendante** du jeu normal : écran de choix de faction → bataille-clickbait (`clickbaitBattle`, avec le tutoriel clickbait, section 5.5).
- La bataille-clickbait a **trois phases** (`rules.md` 7.3) : la phase 1 reprend le terrain de la bataille 01 et une version resserrée de son script, sans Légendaire (`rules.md` 7.3), puis l'armée du joueur passe dans « Le mur » (phase 2, fond retourné) puis « Le fort » (phase 3, provisoire), chacune avec sa vague ennemie. Les zones sont des plans ASCII dans `src/data/battlefield.js` (convertis par `parseObstacleMap`, `src/logic/grid.js`). Logique : `src/logic/phases.js` ; données : `phases` dans `src/data/battles.js` ; animation de sortie/entrée des unités : `BattleScene.applyPhaseTransition`. « Réessayer » après une défaite en phase 2 relance toute la bataille depuis la phase 1. La bataille est **gagnée dès que l'IA a fini le script de la dernière phase (phase 3) et n'a plus d'unité vivante** (`victoryWhenScriptCleared` dans `battles.js`, `rules.md` 7.3).
- **Commandes et abandon restreints** (`POC-SPECS.md`) : la barre de commandes ne propose que **Fuir** (pas d'Aller, pas d'Attaquer, donc pas de voie 2), et le bouton **Abandonner** est absent. Données : `orders` et `surrenderAllowed` dans `src/data/battles.js` ; logique : `availableOrders` (`src/logic/commandSelection.js`) et `surrenderPlayer` (`src/logic/battle.js`).
- **Rien n'est sauvegardé** : la faction choisie reste en mémoire le temps de la session, sans toucher à la sauvegarde du jeu normal (section 5.4) ; une victoire ne marque pas la bataille 01 comme gagnée et ne fige aucune copie.
- **Écran de victoire avec bilan des pertes** : la liste des unités perdues (tuées), par espèce avec le nombre de copies — pour faire sentir le poids des pertes. « Aucune perte ! » s'il n'y en a pas. Calcul : `getCasualtyReport` (`src/logic/deployment.js`). Le jeu normal garde l'écran de victoire minimal (section 5.3).
- Fin de bataille : mêmes écrans que le jeu normal. « Réessayer » relance la bataille-clickbait ; « Continuer » après une victoire ramène au choix de faction du clickbait.
- Accès : bouton « Clickbait » sur l'écran d'introduction, à côté du bouton « MVP » du jeu normal, grisé pour le Rendu 1 (voir 5.2) ; disponible aussi dans le build publié, et raccourci « restart clickbait » du menu devs (section 5.7).

### 5.7 Menu devs (outil de développement)
- Menu burger « devs » fixe en haut à gauche de l'écran, par-dessus tous les écrans (`src/dev/DevMenu.jsx`). **Affiché seulement en développement** (`npm run dev`), absent du build publié.
- Raccourcis :
  - **restart game** : efface la sauvegarde et relance le jeu normal depuis l'introduction.
  - **restart clickbait** : lance la version clickbait (section 5.6) depuis le choix de faction.
  - **test-wyrm** : charge un joueur de test figé et ouvre l'accueil, sans jouer la bataille 01 — faction Wyrms, bataille 01 gagnée, 3 Vers de Lambton et 1 Amphiptère perdus (soit 9 / 7 / 1 individus restants), une armée contenant ces 17 survivants (375 PP) et **10 000 Spirit Stones**. Écrase la sauvegarde. Profils de test : `src/dev/testProfiles.js`.
    - **Niveaux** (`rules.md` 11.5 et 11.6) : joueur à **1 700 XP** (niveau 3, 200 / 1 500 dans le niveau). XP des individus (seuils cumulés : niveau 2 à 50, 3 à 150, 4 à 300, 5 à 500) :
      - Vers de Lambton : 500 (niveau 5, MAX), 320 (4), 160 (3), 60 (2), 20, 0, 0, 0, 0 (niveau 1) ;
      - Amphiptères : 70 (niveau 2), 30, 0, 0, 0, 0, 0 (niveau 1) ;
      - Fafnir : 350 (niveau 4).
  - **test-wyrm-fallen** : comme test-wyrm, mais **Fafnir est mort au niveau 5** — il n'est ni dans les individus possédés ni dans l'armée (16 individus, 265 PP), et le niveau du [Légendaire] à sa mort vaut 5. Sert à tester la réinvocation avec niveau gardé (`rules.md` 11.4).
