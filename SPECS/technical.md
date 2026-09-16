# TECHNICAL.md

Les technologies choisies, pourquoi, et la stratégie de tests. Ce fichier couvre le **comment** — pour le **quoi** (comportement du jeu), voir `rules.md` et `units.md`.

---

## 1. Langage et moteur

| Choix | Techno | Pourquoi |
|---|---|---|
| Langage | **JavaScript** | Choix simple pour démarrer rapidement, sans la charge d'un système de types à maintenir pour un prototype v1 |
| Moteur de jeu | **Phaser 3** (pas Phaser 4) | Phaser 4 est la version activement maintenue depuis avril 2026, mais trop récente pour être bien couverte par les connaissances des outils d'IA utilisés pour coder ce projet (Claude Code). Phaser 3, bien que figé (dernière version 3.90.0, plus de nouvelles fonctionnalités), reste stable et dispose d'une documentation et d'exemples massifs — un agent IA le connaît en profondeur et se trompe moins. Une migration vers Phaser 4 reste possible plus tard, une fois son écosystème plus mature |
| Bundler | **Vite** | Standard actuel pour les projets Phaser modernes, démarrage et rechargement à chaud rapides |
| Gestionnaire de paquets | npm | Par défaut avec Node.js, pas de raison de s'en écarter pour ce projet |

---

## 2. Architecture : séparation logique / rendu

**Principe central : la logique du jeu ne dépend jamais de Phaser.**

- Le **moteur de bataille** (grille, unités, pathfinding, résolution de combat, conditions de victoire/défaite) est écrit en JavaScript pur, sans aucun import de Phaser — un module autonome qui pourrait fonctionner en ligne de commande, sans navigateur ni rendu graphique
- La **couche Phaser** (Scenes, Sprites, input, affichage) est une couche fine par-dessus : elle lit l'état produit par la logique de jeu et l'affiche, elle transmet les clics du joueur vers la logique de jeu, mais ne contient elle-même aucune règle de jeu

**Pourquoi :** ça permet de tester toute la logique de combat/mouvement avec des tests automatisés rapides, sans avoir besoin de lancer le jeu dans un navigateur — essentiel pour la stratégie de tests ci-dessous. Ça garde aussi la porte ouverte à un changement de moteur de rendu plus tard sans toucher aux règles du jeu.

### 2.1 Style de modélisation des données
- **Entités avec comportement et état évolutif** (une unité déployée, la bataille en cours) : modélisées comme des classes ES6 porteuses à la fois de données et de comportement (ex : `Unit`, `Battle`)
- **Configuration statique sans comportement propre** (définitions d'espèces/stats de base, scripts de bataille IA, configuration de grille) : objets JavaScript simples, potentiellement externalisables en JSON, séparés du comportement
- Une unité déployée **référence** sa définition d'espèce statique plutôt que de dupliquer ses stats de base — voir le détail dans `units.md`

### 2.2 Structure de dossiers indicative

```
src/
  logic/           # Moteur de bataille, sans dépendance à Phaser
    grid.js
    unit.js
    combat.js
    pathfinding.js
    battle.js
  data/            # Configuration statique (rosters, scripts IA)
    wyrmsRoster.js
    undeadRoster.js
    battleScript.js
  scenes/          # Couche Phaser (rendu, input)
    BattleScene.js
    DeploymentUI.js
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
```

*Structure indicative, à ajuster librement en cours de développement — ce qui compte est la séparation `logic/` (sans Phaser) vs `scenes/` (Phaser).*

### 2.3 Convention de nommage
- Le jeu sera d'abord en anglais : **le code, les noms de fichiers, les dossiers et les assets utilisent des noms anglais**, même si les documents `SPECS/` restent rédigés en français (ce sont des outils de travail, pas une source de texte à afficher tel quel)
- Ex : la classe `Unit`, le fichier `combat.js`, le sprite `lambton-worm.png` — pas de noms français dans le code

### 2.4 Principe pour la v1 : DRY et simplicité maximale
- Priorité à un code **simple et sans répétition (DRY)** plutôt qu'à une architecture élaborée pensée pour anticiper la v2+
- Pas d'abstraction prématurée (pas de système de plugins, pas de couche de configuration générique) tant qu'un besoin concret ne l'exige pas
- Objectif : le code le plus direct possible pour valider le moteur de bataille, quitte à le retravailler une fois la v1 jouable et testée

## 3. Résolution de rendu

- **Taille d'une case de grille : 64×64 pixels.** Avec la grille de 24×14 cases (`rules.md` section 1), le canevas de jeu fait **1536×896 pixels**.
- **Résolution des assets fournis : 2x la taille d'affichage réelle**, pour rester net sur les écrans haute densité (Retina) — Phaser réduit à l'affichage.
  - Sprites 1 case (Lambton Worm, New-reborn Skeleton, et futurs Amphiptère/Necromant Initiate) : 128×128 px, PNG avec transparence
  - Sprites 4 cases / 2×2 (Fafnir, Athos) : 256×256 px, PNG avec transparence
  - Background de bataille : 3072×1792 px si possible (2x du canevas), sinon 1536×896 px minimum, PNG ou JPG
- Le DPI des fichiers n'a aucune incidence sur le rendu à l'écran — seule la taille en pixels compte.

---

## 4. Stratégie de tests

- **Tests automatisés dès la v1**, avec **Jest**, ciblant exclusivement le dossier `logic/` (la logique de jeu indépendante de Phaser)
- Priorité de couverture :
  1. Résolution de combat (dégâts simultanés, mort, aptitudes automatiques)
  2. Pathfinding (contournement d'obstacles, blocs 2×2, unités [Vol])
  3. Règles d'engagement au corps-à-corps (redirection vers un autre ennemi, file d'attente)
  4. Conditions de fin de bataille (victoire immédiate, compte à rebours de 15s)
  5. Gestion des points de présence et des copies (plafond vivant, copie perdue vs réutilisable)
- **Pas de tests automatisés sur la couche Phaser** (rendu, animations, input) pour la v1 — cette partie reste validée manuellement en jouant, le coût de mise en place de tests de rendu n'étant pas justifié pour un prototype
- Chaque règle chiffrée de `rules.md` doit pouvoir correspondre à au moins un test automatisé qui la vérifie — cohérent avec la consigne de `rules.md` ("chaque ligne doit être vérifiable")
