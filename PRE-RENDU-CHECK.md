# PRE-RENDU-CHECK.md — Sovereign in War

Relecture croisée de `COURS-BRIEF.md` et des documents de `SPECS/` (`CONCEPT.md`, `rules.md`, `units.md`, `GRAPHICS.md`, `technical.md`, `roadmap.md`, `POC-SPECS.md`, `AGENTIC-WORKFLOW.md`) avant le rendu 1.

## Points soulevés et décisions

| # | Point de vigilance | Décision | Fichiers modifiés |
|---|---|---|---|
| 1 | Le tutoriel clickbait n'enseigne ni la pause ni la fuite, alors que la fuite est le cœur de la boucle de succès (« Risque connu » de `POC-SPECS.md`). | **Ajusté, reste à faire** : ajouter au tutoriel clickbait l'étape retraite (Commandes → Fuir → unité), déclenchée **6 s après le début de la phase 2**. À reporter dans `technical.md` 5.5 et `POC-SPECS.md` (ligne « Tutoriel », suppression du « Risque connu »), puis à implémenter. | — |
| 2 | Le POC semblait plus riche que le MVP (trois zones alors que la bataille 01 n'a qu'une phase), ce qui brouille la lecture POC / MVP. Explication : la bataille 01 est restée inachevée. | **Ajusté** : la bataille 01 du MVP reprendra les zones à plusieurs phases, donc le POC en devient un sous-ensemble. Nombre de phases, scripts et condition de victoire de la bataille 01 marqués « à définir ». | `rules.md` 7.3, `roadmap.md` (MVP inclus, tableau des décisions), `POC-SPECS.md` (règles exclues) |
| 3 | `AGENTIC-WORKFLOW.md` décrit surtout la préparation du rendu 1, sans ordre de construction du MVP ni garde-fou de sortie (« deux essais ratés → dernier commit ») ; la phrase sur la structure « prête pour la v2+ » contredit la règle « pas d'abstraction anticipée ». | **Gardé tel quel** | — |
| 4 | Les images de `GRAPHICS.md` pointent vers `SPECS/assets/`, qui n'existe pas : elles ne s'affichent pas. | **Gardé tel quel** | — |
| 5 | La boucle d'échec locale (unité tuée = copie perdue) ne se voit que dans le bilan des pertes, après la zone 3 ; sur le moment, rien ne distingue visuellement une mort d'une fuite. | **Gardé tel quel** | — |
| 6 | Écran d'introduction (texte, bouton MVP grisé) et choix de faction avant l'action : risque pour la lisibilité en dix secondes. | **Gardé tel quel** : le POC commence au clic sur « Clickbait », et l'écran d'introduction est jugé assez clair. | — |
| 7 | `CONCEPT.md` présente le thème comme « un jeu web inspiré des publicités de jeux mobiles », alors que le brief le définit comme une réduction mécanique extrême du jeu. | **Gardé tel quel** | — |
| 8a | `roadmap.md` annonçait « deux parties » (ancienne organisation) et portait une note d'historique. | **Ajusté** : trois parties, POC → MVP → Suite, note d'historique retirée. | `roadmap.md` |
| 8b | `rules.md` 5.2 limitait le gel du tutoriel à la « première bataille uniquement », alors que le tutoriel clickbait gèle lui aussi la bataille. | **Ajusté** : mention retirée. | `rules.md` 5.2 |
| 8c | `rules.md` 7.1 marque le script comme provisoire (« nouvelle règle à venir »), alors que `roadmap.md` et `rules.md` 10 annoncent qu'aucun point n'est ouvert. | **Gardé pour une correction future** | — |
| 8d | 8bitcn est l'identité de l'interface dans `GRAPHICS.md`, mais « provisoire » dans `POC-SPECS.md`. | **Gardé tel quel** | — |

## Points vérifiés sans problème

- **Pas de backend** : front-end only (Vite, Phaser 3, React) ; la seule persistance prévue (MVP) passe par `localStorage`, et le POC ne sauvegarde rien.
- **Stack / règles** : la séparation `src/logic/` (JS pur, testé avec Jest) / Phaser / React permet d'implémenter et de tester les règles de `rules.md` (temps continu, résolution simultanée, pathfinding 2×2 et [Vol]).
- **Graphismes / stack** : pixel art en sprites PNG (Phaser) et interface 8 bits (8bitcn, React) sont compatibles ; les assets finaux existent et sont branchés.
- **Boucles du POC** : boucle de succès (fuir, puis l'unité revient avec ses PV réduits) et boucle d'échec (l'unité meurt et ne revient jamais ; défaite puis « Réessayer ») bien distinctes dans `POC-SPECS.md`, avec les règles incluses et exclues listées section par section.

## Avis global

**Faisable pour le rendu 1.** Le POC est déjà construit et les specs sont détaillées, chiffrées et testables. La séparation logique / rendu est saine.

Il reste une action avant le rendu : **le tutoriel de fuite en phase 2**. C'est la seule garantie qu'un joueur qui découvre le jeu sans explication voie la boucle de succès. Sans lui, il risque de ne voir que des unités qui meurent. Plusieurs choix assumés laissent la lisibilité reposer sur l'exploration du joueur : l'échec n'est visible qu'au bilan final, et il y a deux écrans avant la bataille. Ce tutoriel n'en est que plus important.

Pour le MVP, le principal chantier est la bataille 01 à plusieurs phases, dont le nombre de phases, les scripts et la condition de victoire restent à spécifier dans `rules.md` avant d'être codés. Viennent ensuite les ordres Aller/Attaquer, l'abandon, le tutoriel de départ et la persistance.
