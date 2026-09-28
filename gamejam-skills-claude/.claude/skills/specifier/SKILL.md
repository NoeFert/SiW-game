---
name: specifier
description: Reprend idee-retenue.md et construit, de façon interactive, le concept détaillé du jeu et ses règles précises. Produit CONCEPT.md et RULES.md.
user-invocable: true
argument-hint: ""
---

# Specifier

## Objectif

Transformer l'idée retenue en un concept clair (`SPECS/CONCEPT.md`) et des règles précises (`SPECS/RULES.md`), question par question.

**Important : ce n'est pas encore le moment de réduire au POC.** Ce skill décrit le jeu dans son ensemble, comme s'il allait être fini en entier — pas seulement la tranche qui finira dans la démo. Recentrer sur le POC est le rôle de `/poc-designer`, plus tard dans la chaîne, à partir de ce `RULES.md` complet. Un `CONCEPT.md`/`RULES.md` qui ne décrit que ce qu'on imagine pour la démo est un échec de ce skill, même s'il est cohérent avec le thème clickbait.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer.

## Prérequis

Les fichiers `COURS-BRIEF.md` et `idee-retenue.md` doivent exister à la racine du projet.

Si `COURS-BRIEF.md` est absent : refuse de continuer et dis à l'étudiant de le copier à la racine de son projet.
Si `idee-retenue.md` est absent : refuse de continuer et dis à l'étudiant de lancer `/challenger` d'abord.

## Déroulé

1. Vérifie l'existence de `COURS-BRIEF.md` et `idee-retenue.md`. Si l'un manque, arrête-toi ici avec le message de refus correspondant.

2. Lis `COURS-BRIEF.md` (attentes exactes du rendu 1) et `idee-retenue.md`.

3. Construis `CONCEPT.md` par une série de questions une par une, par exemple :
   - Quel est le but du joueur ?
   - Quelle est la boucle de jeu principale (ce que le joueur répète) ?
   - Comment on gagne ? Comment on perd ?
   - Qu'est-ce qui rend ce jeu spécifiquement "clickbait" ?
   - Au-delà de la boucle de base, quelles autres mécaniques imagines-tu pour le jeu complet (progression, nouveaux éléments, variantes) ? Même si elles ne feront pas partie du POC.

   Après chaque réponse, reformule brièvement ce que tu as compris avant de poser la question suivante, pour que l'étudiant puisse corriger.

4. Une fois le concept stabilisé, crée le dossier `SPECS/` à la racine du projet s'il n'existe pas, et écris `SPECS/CONCEPT.md`.

5. Enchaîne sur `RULES.md` de la même façon, question par question : règles précises (contrôles, contraintes, conditions de victoire/défaite, éléments aléatoires, etc.) pour **tout** ce qui a été évoqué dans `CONCEPT.md`, y compris les mécaniques qui ne feront pas partie du POC. Reste vigilant sur les points faibles notés dans `idee-retenue.md` (risque hors-sujet, risque de complexité) et signale-le à l'étudiant si une réponse s'y expose. L'exemple de `RULES.md` dans `COURS-BRIEF.md` est volontairement minimal (illustration pédagogique) : passe en revue chaque élément du jeu un par un jusqu'à couvrir l'intégralité du concept, pas seulement deux ou trois mécaniques, et pas seulement ce qui te semble suffisant pour une démo. Le fichier final doit être plus fourni et plus précis que cet exemple.

6. Écris `SPECS/RULES.md`.

7. **Auto-vérification des trous.** Relis `SPECS/RULES.md` que tu viens d'écrire en te mettant à la place d'un agent IA à qui on le donnerait tel quel pour coder le jeu, sans autre contexte. Pour chaque élément ou action mentionné dans `CONCEPT.md` ou dans `RULES.md`, demande-toi : est-ce que sa règle est chiffrée et vérifiable, ou est-ce qu'un agent devrait deviner/inventer un comportement ? Cherche en particulier :
   - des éléments cités mais sans règle précise associée (coût, vitesse, durée, condition manquants)
   - des cas limites non traités (que se passe-t-il à zéro, au maximum, en cas d'action simultanée ou invalide)
   - des conditions de victoire/défaite qui restent vagues

   Liste les trous trouvés, puis présente-les à l'étudiant un par un (observation courte + question précise pour combler le trou), en attendant sa réponse avant de passer au suivant.

8. Une fois toutes les questions de l'étape 7 répondues, mets à jour `SPECS/RULES.md` avec les précisions apportées.

9. Confirme à l'étudiant que `SPECS/CONCEPT.md` et `SPECS/RULES.md` sont prêts et indique l'étape suivante : `/art-director`.
