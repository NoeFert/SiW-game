# GAMEJAM — contexte du rendu 1

Ce fichier donne aux skills le contexte du cours nécessaire pour challenger et guider correctement l'étudiant. Il doit être copié à la racine du projet de jeu, à côté de `.claude/skills/`.

## Le module

GAMEJAM : conception et production d'un petit jeu web, avec un agent IA comme outil de production. Le cours pousse à investir le temps sur la conception (concept, règles, direction graphique, choix technique, découpage du périmètre) plutôt que sur l'implémentation, parce que l'agent rend la production de code rapide.

## Le thème "clickbait"

Le thème ne désigne pas un genre de jeu à copier (pas besoin de faire un jeu qui ressemble à un clickbait classique). N'importe quel jeu peut avoir sa version clickbait.

"Clickbait" désigne un traitement : la version la plus extrême et la plus réduite possible du concept de MVP. C'est la "pub" du jeu — ce qui se comprend et se vend en quelques secondes, sans explication. Le thème force à pousser cette réduction à l'extrême, pas à choisir un univers ou une mécanique particulière.

**Ce que ça veut dire concrètement :** le critère est mécanique, pas décoratif. Un jeu répond au thème dès que sa mécanique se comprend en dix secondes et qu'il existe une version ultra-minimale jouable de cette mécanique. Un décor qui évoque le clickbait pour de vrai (compte à rebours "plus que 5 secondes", faux jeu télé putaclic, titre choc façon "vous ne devinerez jamais...") est une option de mise en scène possible, jamais une obligation. Ne pas orienter systématiquement les suggestions de thème/décor vers l'imagerie clickbait : la plupart des bonnes pistes n'ont rien à voir avec cet univers visuel et respectent quand même le thème.

## Les trois strates du projet

1. **POC ("mode pub", clickbait)** — rendu 1. Un périmètre volontairement tout petit : un ou deux prompts à l'agent peuvent suffire. Ne contient pas toutes les mécaniques du jeu, ce n'est ni le MVP ni une validation du jeu entier. Le code du POC peut être gardé, repris en partie, ou jeté — ce qui compte est ce que l'étudiant en tire, pas la qualité du code produit.

   **Ce que le POC doit démontrer précisément :** il se concentre sur la mécanique centrale du jeu, rien d'autre. L'idéal est qu'il montre à la fois une **boucle de succès** (le joueur fait X, ça marche) et une **boucle d'échec** (le joueur fait Y, c'est une erreur) : voir les deux côte à côte permet de comprendre la mécanique par l'exemple, sans texte explicatif. Tout ce qui ne sert pas directement à cette compréhension doit être coupé — en particulier le texte ou le dialogue décoratif, et l'interface peut rester volontairement simplifiée (formes/couleurs à la place des assets finaux) tant que la mécanique reste lisible.
2. **MVP** — jeu complet mais minimal (rendu 2 / final). Une seule évolution bien intégrée vaut mieux que cinq fonctionnalités fragiles. Jugé sur sa pertinence, pas sur son volume.
3. **Suite** — pistes d'évolution au-delà du MVP. Jamais développée, sert seulement à montrer que l'idée a une direction. Ne pas confondre "suite" (mentionnée) et "travail à livrer".

## Ce que contient le rendu 1

Le rendu 1 comprend deux livrables : le POC jouable (mode pub), et la conception du MVP (les documents ci-dessous). Ce n'est pas "une petite version sans direction" : la conception du MVP doit déjà être posée, même si le MVP n'est pas encore codé.

### Fichiers attendus, dans `SPECS/`

Un fichier par sujet. On peut en ajouter selon le jeu, jamais en retirer. Exemples ci-dessous repris tels qu'enseignés (jeu de bois : cliquer sur un arbre pour récolter du bois, construire une cabane, engager des bûcherons).

**Ces exemples sont volontairement minimaux** — ce sont des exemples pédagogiques pour montrer la forme attendue, pas le niveau de détail attendu. C'est particulièrement vrai pour `RULES.md` : l'exemple ne couvre que trois éléments de jeu avec une poignée de règles chacun. Un vrai `RULES.md` de rendu doit couvrir l'intégralité du jeu (tous les éléments, toutes les interactions, tous les cas limites), avec beaucoup plus de règles chiffrées que l'exemple. Les skills doivent produire des fichiers plus fournis et plus poussés que ces exemples, pas les recopier à l'identique en changeant juste le thème.

**`SPECS/CONCEPT.md`** — le jeu en quelques lignes : de quoi il parle, ce que le joueur cherche à réussir.

```md
# Concept

Le joueur clique sur un arbre pour récolter du bois. Avec ce bois il construit
une cabane, puis engage des bûcherons qui coupent à sa place.

## Objectif du joueur

Passer du clic manuel à une production qui tourne toute seule.

## En une phrase

Je clique pour récolter du bois, puis je le dépense pour ne plus avoir à cliquer.
```

**`SPECS/RULES.md`** — les règles en détail, chiffrées. Chaque ligne doit être vérifiable (donc testable).

```md
# Règles

## Récolte

- Un clic sur un arbre donne 1 bois.
- Le stock de départ est de 20 bois maximum.

## Cabane

- Coûte 15 bois.
- Fait passer le stock maximum à 100.

## Bûcheron

- Coûte 30 bois, cumulable.
- Produit 1 bois toutes les 3 secondes.
- Ne produit plus si le stock est plein.
```

**`SPECS/GRAPHICS.md`** — la direction artistique, avec des images liées depuis `SPECS/assets/`.

```md
# Direction artistique

## Ambiance

Forêt de jour, style plat, sans texture. Trois couleurs : vert sapin,
brun bois, jaune pour tout ce qui est cliquable.

## Références

![Arbre cliquable](./assets/arbre.png)
![Compteur de bois](./assets/compteur.png)

## Règle

Ce qui est cliquable est jaune. Rien d'autre n'est jaune.
```

**`SPECS/TECHNICAL.md`** — les technos choisies, pourquoi, et la stratégie de tests.

```md
# Technique

## Stack

React + TypeScript, build Vite. Pas de framework de jeu : il n'y a ni
scène animée ni collision, seulement des données et des boutons.

## Structure

- src/state/  le Game State
- src/rules/  fonctions pures
- src/ui/     composants d'affichage

## Tests

Vitest sur src/rules/. Une règle chiffrée de RULES.md = un test.
```

**`SPECS/AGENTIC-WORKFLOW.md`** — la façon de travailler avec l'IA pour construire le **MVP** (rendu 2), pas le POC : ce fichier est rendu en même temps que le POC, mais il ne décrit pas comment celui-ci a été fait (il se construit vite, en un ou deux prompts, sans méthode formalisée). Quelques lignes suffisent, non noté sur la sophistication mais sur le fait que ce soit décidé et suivi.

```md
# Travail avec l'agent

## Ma boucle

1. Je copie la règle chiffrée de RULES.md dans le prompt, telle quelle.
2. L'agent écrit le test avant le code.
3. Je lance `npm test`, puis je lis le diff.
4. Je commite seulement si le test passe.
5. Une fonctionnalité par session.

## Mes garde-fous

- Trois fichiers touchés au maximum par session.
- L'agent ne touche pas à src/state/ sans que je l'aie demandé.
- Une règle absente de RULES.md : je complète la spec avant de relancer.
- Deux essais ratés : je reviens au dernier commit.
```

**`SPECS/POC-SPECS.md`** — fichier supplémentaire propre à ce parcours (n'en fait pas partie des six officiels du cours, mais recommandé pour cadrer précisément le POC avant de le coder). `CONCEPT.md`/`RULES.md` décrivent le jeu complet ; ce fichier recentre sur ce que le POC en démontre, avec la liste explicite des règles incluses et exclues — pas seulement une note sur ce qui manque.

```md
# POC — spécification

## Description du POC

Une seule mécanique : cliquer sur l'arbre pour récolter du bois, jusqu'à
ce que le stock soit plein. Le reste du jeu (cabane, bûcherons) n'apparaît
pas ici, voir "Règles exclues" ci-dessous.

## Actions démontrées

- Cliquer sur l'arbre pour récolter du bois

## Boucle de succès

Le joueur clique 20 fois : le compteur de bois affiche 20/20, un message
"stock plein" apparaît. Ça marche.

## Boucle d'échec

Le joueur clique une 21e fois : rien ne se passe, le compteur reste bloqué
à 20. Le clic ne fait plus rien de visible : c'est l'erreur à éviter.

## Règles incluses dans le POC

- Récolte : un clic donne 1 bois, stock de départ 20 bois maximum

## Règles exclues du POC

- Cabane (réservée au MVP)
- Bûcheron, production automatique (réservés au MVP)

## Interface

Un carré brun pour l'arbre, un chiffre pour le compteur, aucun texte de
mise en scène — pas la direction artistique finale de GRAPHICS.md.

## Checklist

- Le POC démontre la récolte sans expliquer la règle par du texte
- Le POC démontre le blocage à 20 sans ajouter d'autre mécanique
```

**`SPECS/POC-ASSETS.md`** — fichier supplémentaire propre à ce parcours, comme `POC-SPECS.md` : la liste des visuels (images, icônes) réellement utilisés dans le POC, chacun soit en "forme/couleur simple, pas d'asset" soit avec le chemin d'un vrai fichier existant. Tout visuel doit exister comme fichier réel et être validé avant que le POC ne soit codé — pas de référence à une image qui n'existe pas.

```md
# POC — assets

## Arbre

Forme/couleur simple : carré brun (#6b4a2f), pas d'asset.

## Compteur de bois

Forme/couleur simple : texte "X / 20", pas d'asset.
```

**`SPECS/ROADMAP.md`** — reprend la séparation POC / MVP / suite. Le cours n'exige que deux parties (MVP, puis suite) car le périmètre du POC est déjà fixé ailleurs (brainstorm, roadmapper) et n'a pas besoin d'être re-planifié dans ce fichier ; pour ce parcours, on garde volontairement une troisième section POC en tête de fichier, pour que le passage du brainstorm à la roadmap reste traçable.

```md
# Roadmap

## POC · périmètre du rendu 1

- clic sur l'arbre, compteur de bois

## MVP · à terminer pour le rendu final

- [x] clic sur l'arbre, compteur
- [ ] cabane, stock maximum
- [ ] bûcherons, production auto
- [ ] écran de fin et rejouer
- [ ] équilibrage des coûts

## La suite · si le temps le permet

- (idées d'évolution, jamais développées)
```

Les documents de travail intermédiaires produits avant ces six fichiers (`brainstorm.md`, `idee-retenue.md`, etc.) peuvent rester à la racine du projet, ils ne font pas partie des livrables `SPECS/`.

## Contraintes techniques

Le projet reste un projet **front-end web**. Aucun backend n'est requis, ni autorisé comme solution par défaut.

- **Autorisé :** HTML/CSS, JavaScript ou TypeScript, React/Vue/Angular/Svelte, Phaser/ExcaliburJS/KaPlay et équivalents.
- **Stockage local, si le jeu a besoin de sauvegarder des données** (score, progression, réglages) : `localStorage` ou `IndexedDB`, dans le navigateur. Jamais de serveur, de base de données distante ou d'API à héberger pour ça.
- **Hors périmètre :** Unity, Godot, Unreal, les jeux centrés sur la 3D, la physique complexe.

## Choix technique

Le choix de moteur/stack doit être justifié par un vrai critère (type de jeu, contrainte technique, ce que l'étudiant sait déjà faire). "J'ai pris X parce que c'est fait pour ça" n'est pas une justification suffisante. Toute proposition de backend (API à coder, base de données distante, authentification serveur) est hors périmètre : rediriger vers le stockage local si le besoin est de la persistance.

## Ce qui est évalué au rendu 1

La note porte sur la démarche de conception, pas sur la qualité ou la sophistication du code du POC. Une réduction de périmètre décidée après un retour de l'enseignant est normale et attendue, pas un échec.

Le jeu sera ouvert sans aucune explication au rendu final : ce qui se comprend dans les dix premières secondes compte. C'est une exigence de lisibilité immédiate, cohérente avec l'esprit "clickbait" du POC.
