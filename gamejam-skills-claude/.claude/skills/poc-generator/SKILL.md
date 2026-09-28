---
name: poc-generator
description: Construit réellement le POC jouable en suivant SPECS/POC-SPECS.md et les assets validés dans SPECS/POC-ASSETS.md, avec des points de contrôle interactifs. Dernière étape de la chaîne.
user-invocable: true
argument-hint: ""
---

# POC generator

## Objectif

Construire le POC jouable tel que cadré dans `SPECS/POC-SPECS.md` (actions, boucle de succès, boucle d'échec, ce qui est explicitement exclu). C'est la dernière étape de la chaîne : à la fin, le POC doit tourner.

Le POC se construit vite, en un ou deux prompts (voir `COURS-BRIEF.md`) : ce n'est pas ici qu'on applique une méthode de travail formalisée. `SPECS/AGENTIC-WORKFLOW.md` décrit la méthode prévue pour construire le **MVP** par la suite, pas pour ce POC — ne t'appuie pas dessus ici.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer. Ne code pas tout d'un bloc sans repasser par l'étudiant.

## Prérequis

Le fichier `SPECS/POC-ASSETS.md` doit exister à la racine du projet (ce qui suppose que `PRE-RENDU-CHECK.md` et tous les documents `SPECS/` existent aussi).

Si absent : refuse de continuer et dis à l'étudiant de lancer `/asset-generator` d'abord.

## Déroulé

1. Vérifie l'existence de `SPECS/POC-ASSETS.md`. Si absent, arrête-toi ici avec le message de refus.

2. Lis `SPECS/POC-SPECS.md`, `SPECS/POC-ASSETS.md`, `SPECS/RULES.md`, `SPECS/TECHNICAL.md` et, s'il existe, `SPECS/GRAPHICS.md`.

3. Récapitule en 3-4 lignes le périmètre du POC (actions, boucle de succès, boucle d'échec, ce qui est exclu) et demande confirmation à l'étudiant avant de commencer à coder.

4. Implémente, dans l'ordre : d'abord la boucle de succès, puis la boucle d'échec, puis l'interface minimale décidée dans `POC-SPECS.md`. Respecte la stack de `TECHNICAL.md`. Pour chaque élément visuel, utilise exactement ce que prévoit `SPECS/POC-ASSETS.md` (fichier existant ou forme/couleur simple) — n'invente pas de référence à une image qui n'y figure pas. Reste au périmètre défini — pas de fonctionnalité ou de contenu qui ne serve pas directement les deux boucles.

5. Arrête-toi après chaque brique fonctionnelle (boucle de succès codée, puis boucle d'échec codée, puis interface) et demande à l'étudiant de valider avant de continuer — montre ce qui a été fait, pas seulement ce qui reste à faire.

6. Si une règle nécessaire n'est pas dans `RULES.md`, ou si le périmètre de `POC-SPECS.md` s'avère irréaliste en cours de route, dis-le à l'étudiant plutôt que d'improviser silencieusement ; propose d'ajuster la spec avant de continuer.

7. Une fois le POC fonctionnel, reprends la checklist de vérification de `POC-SPECS.md` un point à la fois avec l'étudiant (jeu manuel à l'appui) : la boucle de succès est-elle démontrée, la boucle d'échec est-elle démontrée, l'interface reste-t-elle dépourvue d'éléments décoratifs superflus.

8. Confirme à l'étudiant que le POC est prêt pour le rendu 1. Rappelle l'ensemble de la chaîne parcourue (`brainstorm.md` → `idee-retenue.md` → `CONCEPT.md`/`RULES.md` → `GRAPHICS.md` → `TECHNICAL.md` → `ROADMAP.md` → `POC-SPECS.md` → `AGENTIC-WORKFLOW.md` → `PRE-RENDU-CHECK.md` → `POC-ASSETS.md` → POC codé) et suggère de committer avec un message clair.
