---
name: spec-reviewer
description: Relit tous les fichiers de SPECS/ ensemble et traque les incohérences entre fichiers et les trous dans les règles qui pourraient pousser un agent IA à inventer une règle au moment du développement. Utilisable à tout moment, pas seulement avant le rendu. Produit SPECS-REVIEW.md.
user-invocable: true
argument-hint: ""
---

# Spec reviewer

## Objectif

Éviter à tout prix qu'un agent IA invente une règle faute de l'avoir trouvée écrite. Ce skill relit l'ensemble des fichiers de `SPECS/` ensemble (pas un seul à la fois) pour traquer deux choses : les incohérences entre fichiers, et les trous dans les règles — tout élément mentionné quelque part (concept, roadmap, technique) sans règle précise, chiffrée et vérifiable qui lui corresponde dans `RULES.md`. Produire `SPECS-REVIEW.md`.

Contrairement à `/pre-rendu-check` (qui vérifie la faisabilité du rendu 1 en particulier), ce skill est un audit général de cohérence et de complétude, utilisable à tout moment du projet — avant un rendu, mais aussi en pleine construction du MVP, ou après avoir utilisé `/enricher` plusieurs fois.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer. Signale un point à la fois, jamais une liste de problèmes d'un coup.

## Prérequis

Les fichiers `COURS-BRIEF.md`, `SPECS/CONCEPT.md` et `SPECS/RULES.md` doivent exister.

Si `COURS-BRIEF.md` est absent : refuse de continuer et dis à l'étudiant de le copier à la racine de son projet.
Si `SPECS/CONCEPT.md` ou `SPECS/RULES.md` est absent : refuse de continuer et dis à l'étudiant de lancer `/specifier` d'abord.

## Déroulé

1. Vérifie l'existence de `COURS-BRIEF.md`, `SPECS/CONCEPT.md` et `SPECS/RULES.md`. Si l'un manque, arrête-toi ici avec le message de refus correspondant.

2. Lis `SPECS/CONCEPT.md` et `SPECS/RULES.md`, puis tous les autres fichiers présents dans `SPECS/` (`GRAPHICS.md`, `TECHNICAL.md`, `ROADMAP.md`, `POC-SPECS.md`, `POC-ASSETS.md`, `AGENTIC-WORKFLOW.md` — ne bloque pas si certains n'existent pas encore, relis ce qui est là).

3. **Construis mentalement la liste de tout élément ou mécanique cité n'importe où** (`CONCEPT.md`, `ROADMAP.md`, `TECHNICAL.md`, `POC-SPECS.md`...). Pour chacun, vérifie qu'il existe dans `RULES.md` une règle qui le couvre — pas juste une mention, une règle chiffrée et vérifiable. Cherche en particulier :
   - des éléments mentionnés ailleurs mais totalement absents de `RULES.md`
   - des éléments présents dans `RULES.md` mais sans valeur chiffrée (coût, vitesse, seuil, durée)
   - des cas limites non traités (zéro, maximum, actions simultanées ou invalides)
   - des conditions de victoire/défaite qui restent vagues

4. **Cherche les incohérences entre fichiers**, par exemple :
   - une valeur citée différemment dans deux fichiers (un coût, un seuil, un nom d'élément)
   - un game state dans `TECHNICAL.md` qui ne représente pas un élément décrit dans `RULES.md`
   - une direction graphique (`GRAPHICS.md`) qui suppose un élément que `RULES.md` ne définit pas
   - une section de `ROADMAP.md` (POC, MVP, suite) qui contredit ce que `POC-SPECS.md` inclut ou exclut

5. Présente chaque trou ou incohérence trouvé un par un : observation courte + question précise pour trancher ("cet élément, tu confirmes la règle X, ou c'est autre chose ?"). Attends la réponse avant de passer au point suivant.

6. Si l'étudiant confirme une correction, propose de mettre à jour le fichier concerné (avec son accord) avant de continuer.

7. Une fois tous les points passés en revue, écris `SPECS-REVIEW.md` à la racine du projet : liste des trous et incohérences trouvés, décision prise pour chacun, et une conclusion explicite du type "un agent IA qui recevrait ces fichiers sans autre contexte n'aurait pas besoin d'inventer de règle" (ou, si des points restent ouverts, lesquels).

8. Confirme à l'étudiant que `SPECS-REVIEW.md` est prêt. Rappelle que ce skill peut être relancé à tout moment, notamment après plusieurs `/enricher`, ou avant de lancer une grosse session de développement du MVP avec l'agent.
