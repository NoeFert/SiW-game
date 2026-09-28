# Sovereign in War

Jeu de stratégie web où l'on déploie des monstres qui combattent seuls, avec un contrôle limité par quelques ordres. Projet de la Gamejam CREA 2026, thème « Clickbait game ».

- **Rendu 1 (POC)** : la version clickbait, une bataille en trois zones qui imite une publicité de jeu de stratégie.
- Concept et mécanique pub : [`SPECS/CONCEPT.md`](SPECS/CONCEPT.md). Toutes les spécifications sont dans [`SPECS/`](SPECS/).

## Stack

| Rôle | Outil |
|---|---|
| Langage | JavaScript |
| Champ de bataille | Phaser 3.90 |
| Interface autour (tour de commandement, écrans) | React 19, Tailwind CSS 4, shadcn/ui avec le thème 8bitcn |
| Bundler | Vite |
| Tests | Jest (logique de jeu uniquement, `tests/logic/`) |

Pourquoi ces choix : [`SPECS/TECHNICAL.md`](SPECS/TECHNICAL.md).

## Lancer le projet

Prérequis : **Node.js 20.11 ou plus récent** (la configuration Vite utilise `import.meta.dirname`).

```
npm install
npm run dev        # jeu en local, sur l'URL affichée par Vite
npm test           # tests Jest de la logique de jeu
npm run build      # build de production dans dist/
npm run preview    # sert le build de production en local
```

Dans le jeu : sur l'écran d'introduction, cliquer **Clickbait**, choisir une faction, puis suivre le tutoriel. Le bouton **MVP** est grisé pour ce rendu.

## Structure du code

```
src/
  logic/     moteur de bataille, JavaScript pur, sans Phaser ni React (testé par Jest)
  data/      données statiques : rosters, scripts de l'IA, zones, tutoriels
  scenes/    Phaser : affichage du champ de bataille et clics sur le terrain
  ui/        React : tour de commandement (déploiement, pause, commandes, tutoriel)
  screens/   React : écrans (intro, choix de faction, bataille, victoire, défaite…)
  state/     pont entre Phaser et React (objet `battle` partagé)
tests/logic/ tests Jest de chaque règle de SPECS/RULES.md
assets/      sprites et fond, servis tels quels par Vite
```

## Ce que le POC m'a appris

**Ce qui marche**
- La séparation entre la logique (`src/logic/`) et l'affichage (Phaser, React) tient : toutes les règles se testent sans navigateur (261 tests Jest), et une nouvelle zone ou un nouveau tutoriel s'ajoute en modifiant seulement des données.
- Le cœur du jeu est jouable : déployer sous un plafond de présence, laisser combattre, donner de rares ordres. Les données changent visiblement à l'écran (jauge de présence, compteur de copies, barres de vie, bilan des pertes).
- L'enchaînement de trois zones avec des obstacles différents crée de vraies questions tactiques.
- Faire fuir une unité au bon moment, puis la voir revenir avec ses PV réduits, rend lisible la boucle de succès : c'est là que le contrôle limité prend son sens.

**Ce qui ne marchait pas**
- Les règles avaient des trous que l'IA avait comblés seule, sans le dire : distance mesurée depuis quelle case d'une unité 2×2, départage entre deux ennemis à égale distance, dernière attaque d'une fuite comptée pour les aptitudes, diagonales qui coupent le coin d'un obstacle, unité en fuite encerclée, deux comptes à rebours qui expirent en même temps… La relecture des specs (`SPECS-REVIEW.md`) en a relevé neuf. Ils sont tranchés dans `RULES.md`, et le code a été réaligné avec un test pour chacun.
- Un bug d'ordre de résolution : une unité en fuite pouvait mourir ou survivre selon l'ordre interne des unités. Corrigé et testé.
- Le tutoriel n'enseignait que le déploiement : un joueur qui découvrait le jeu voyait surtout ses unités mourir, sans découvrir la fuite. Corrigé : une étape « battre en retraite » s'affiche en phase 2.
- La boucle d'échec reste peu visible sur le moment : rien ne distingue une unité tuée d'une unité en fuite, la perte n'apparaît que dans le bilan final.
- Le POC était devenu plus riche que le MVP prévu (trois zones contre une seule phase pour la bataille 01), ce qui brouillait la lecture POC / MVP.
- La version clickbait devenait inaccessible une fois le jeu normal lancé. Corrigé : le jeu démarre toujours sur l'intro, et le MVP est verrouillé.

**Ce que je change pour le MVP**

- Spécifier la bataille 01 avant de la coder : elle reprendra les trois zones du POC en plusieurs phases (nombre de phases, scripts et condition de victoire encore à définir).
- Rouvrir le jeu normal (bouton MVP) avec son parcours complet, les ordres Aller et Attaquer, le bouton Abandonner et la sauvegarde des pertes.
- Rendre la mort d'une unité visible au moment où elle arrive, pas seulement dans le bilan.

**Structure du code : OK**, avec une dette à solder pour le MVP (liste ci-dessous).

## À corriger pour le MVP

- Sauvegarde fragile : un localStorage corrompu ou bloqué donne un écran blanc (`src/persistence.js`).
- Au premier tick d'une fuite, un ennemi peut frapper deux fois (coup normal et dernière attaque).
- Code mort : `findNearestEnemy`, `timeControl`, `PAUSE_DEFAULTS`.
- Dépendances inutiles : `cn` à retirer, `shadcn` à passer en devDependencies.
- Textes affichés en dur dans `BattleScene.js` et dans les écrans, hors de `strings.js`.
- Assemblage de la bataille à sortir de la Scene Phaser vers `src/logic/`.
- La tour React se re-rend à chaque frame.
- Pas de linter.
