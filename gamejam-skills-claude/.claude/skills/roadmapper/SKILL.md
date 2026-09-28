---
name: roadmapper
description: Construit de façon interactive la roadmap du projet en trois parties (POC/clickbait, MVP, suite), à partir de TECHNICAL.md et des fichiers précédents. Produit ROADMAP.md.
user-invocable: true
argument-hint: ""
---

# Roadmapper

## Objectif

Découper le périmètre du projet en trois parts claires et produire `SPECS/ROADMAP.md` :
1. **POC / clickbait** : ce que contient le POC "mode pub" du rendu 1, pas forcément tout le reste
2. **MVP** : ce qui sera réellement inclus dans le jeu complet mais minimal
3. **Suite** : pistes d'évolution mentionnées mais jamais développées, hors périmètre à livrer

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer.

## Prérequis

Les fichiers `COURS-BRIEF.md` et `SPECS/TECHNICAL.md` doivent exister (et donc, en amont, `SPECS/CONCEPT.md`, `SPECS/RULES.md`, `SPECS/GRAPHICS.md`).

Si `COURS-BRIEF.md` est absent : refuse de continuer et dis à l'étudiant de le copier à la racine de son projet.
Si `SPECS/TECHNICAL.md` est absent : refuse de continuer et dis à l'étudiant de lancer `/tech-advisor` d'abord.

## Déroulé

1. Vérifie l'existence de `COURS-BRIEF.md` et `SPECS/TECHNICAL.md`. Si l'un manque, arrête-toi ici avec le message de refus correspondant.

2. Lis `COURS-BRIEF.md`, `SPECS/CONCEPT.md`, `SPECS/RULES.md`, `SPECS/GRAPHICS.md` et `SPECS/TECHNICAL.md`.

3. Passe en revue les fonctionnalités/éléments un par un, en posant à chaque fois une question du type "Cet élément, tu le vois dans le POC, dans le MVP, ou en suite ?". Rappelle que le POC reste volontairement tout petit (un ou deux prompts peuvent suffire) : aide à trancher si une réponse est trop ambitieuse pour le POC ou pour le MVP.

4. Vérifie que le MVP reste cohérent et pertinent : si le MVP proposé semble trop chargé, dis-le clairement à l'étudiant et demande ce qu'il/elle est prêt(e) à repousser en "suite" (une seule évolution bien intégrée vaut mieux que cinq fonctionnalités fragiles).

5. Écris `SPECS/ROADMAP.md` avec les trois sections (POC, MVP, Suite), chacune listant les éléments qui y ont été rangés.

6. Confirme à l'étudiant que `SPECS/ROADMAP.md` est prêt et indique l'étape suivante : `/poc-designer`.
