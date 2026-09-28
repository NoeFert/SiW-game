---
name: workflow-designer
description: Aide l'étudiant à définir la méthode de travail avec un agent IA pour construire le MVP (rendu 2) — le POC, lui, est déjà construit à ce stade. Skill à part, utilisable dès que ROADMAP.md existe, indépendamment du reste de la chaîne. Produit SPECS/AGENTIC-WORKFLOW.md.
user-invocable: true
argument-hint: ""
---

# Workflow designer

## Objectif

`AGENTIC-WORKFLOW.md` est rendu en même temps que le POC (rendu 1), mais il ne décrit pas comment le POC a été construit — le POC se construit vite, en un ou deux prompts, sans méthode formalisée. Ce fichier décrit la méthode que l'étudiant compte utiliser avec un agent IA pour construire le **MVP** (rendu 2) : comment il/elle organisera le travail, quelles étapes déléguer, comment vérifier ce qui est produit, comment garder le contrôle. Produire `SPECS/AGENTIC-WORKFLOW.md`.

Ce n'est pas une étape de la chaîne numérotée (elle ne dépend pas de `/poc-designer` ni du reste du travail sur le POC) : on peut l'appeler dès que `SPECS/ROADMAP.md` existe, à n'importe quel moment, y compris avant que le POC soit terminé. `SPECS/AGENTIC-WORKFLOW.md` reste néanmoins un des livrables attendus au rendu 1 (voir `COURS-BRIEF.md`) : il doit exister avant `/pre-rendu-check`.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer.

## Prérequis

Les fichiers `COURS-BRIEF.md` et `SPECS/ROADMAP.md` doivent exister.

Si `COURS-BRIEF.md` est absent : refuse de continuer et dis à l'étudiant de le copier à la racine de son projet.
Si `SPECS/ROADMAP.md` est absent : refuse de continuer et dis à l'étudiant de lancer `/roadmapper` d'abord.

## Déroulé

1. Vérifie l'existence de `COURS-BRIEF.md` et `SPECS/ROADMAP.md`. Si l'un manque, arrête-toi ici avec le message de refus correspondant.

2. Lis `COURS-BRIEF.md` (rappel : ce fichier n'est pas noté sur sa sophistication, mais sur le fait qu'il soit décidé et suivi — quelques lignes suffisent), `SPECS/ROADMAP.md` (section MVP), `SPECS/TECHNICAL.md`, `SPECS/RULES.md` et `SPECS/CONCEPT.md`. S'il existe déjà, `SPECS/POC-SPECS.md` n'est pas le sujet ici : ne pose pas de questions dessus.

3. Mène l'échange, une question à la fois, pour couvrir :
   - Quelle méthode de travail avec l'agent pour construire le MVP : par exemple uniquement du chat et des échanges de questions/réponses, un journal de décisions tenu en markdown, les issues GitHub comme source de backlog, ou une autre méthode que l'étudiant préfère
   - Quelles parties du MVP l'étudiant compte faire produire par un agent IA, et lesquelles il/elle préfère écrire lui/elle-même
   - Comment il/elle compte vérifier ce que l'agent produit (relecture, tests, jeu manuel) avant de l'accepter
   - À quel moment il/elle prévoit de reprendre la main si l'agent part dans une mauvaise direction
   - Comment il/elle documentera ou comprendra le code produit par l'agent, pour pouvoir l'expliquer à l'oral

4. Reformule ce qui a été décidé après chaque bloc de réponses pour validation, avant de passer au point suivant.

5. Écris `SPECS/AGENTIC-WORKFLOW.md` (quelques lignes suffisent) : étapes du développement, répartition agent/étudiant, méthode de vérification à chaque étape.

6. Confirme à l'étudiant que `SPECS/AGENTIC-WORKFLOW.md` est prêt. Rappelle que ce fichier fait partie des livrables attendus au rendu 1 : s'il ne l'a pas déjà fait, il devra passer par `/pre-rendu-check` avant `/asset-generator` et `/poc-generator`.
