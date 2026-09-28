---
name: enricher
description: Intègre une nouvelle idée dans un jeu déjà conçu — affine l'idée, met à jour CONCEPT.md/RULES.md/ROADMAP.md (et GRAPHICS.md/TECHNICAL.md si besoin), et vérifie que RULES.md couvre bien l'ajout. Utilisable à tout moment après /specifier, pas seulement en fin de chaîne.
user-invocable: true
argument-hint: "<ton idée à ajouter au jeu>"
---

# Enricher

## Objectif

L'étudiant a une nouvelle idée pour son jeu après que la conception a déjà avancé. Ce skill l'intègre proprement : affiner l'idée par les échanges, mettre à jour tous les fichiers `SPECS/` concernés, et vérifier que `RULES.md` couvre bien ce qui vient d'être ajouté — sans laisser les fichiers se désynchroniser entre eux.

Ce n'est pas une étape de la chaîne numérotée : on peut l'appeler à tout moment une fois que `CONCEPT.md` et `RULES.md` existent, autant de fois que nécessaire.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer.

## Prérequis

Les fichiers `COURS-BRIEF.md`, `SPECS/CONCEPT.md`, `SPECS/RULES.md` et `SPECS/ROADMAP.md` doivent exister.

Si `COURS-BRIEF.md` est absent : refuse de continuer et dis à l'étudiant de le copier à la racine de son projet.
Si `SPECS/CONCEPT.md` ou `SPECS/RULES.md` est absent : refuse de continuer et dis à l'étudiant de lancer `/specifier` d'abord.
Si `SPECS/ROADMAP.md` est absent : refuse de continuer et dis à l'étudiant de lancer `/roadmapper` d'abord (il faut savoir où placer l'ajout).

## Déroulé

1. Vérifie l'existence des quatre fichiers ci-dessus. Si l'un manque, arrête-toi ici avec le message de refus correspondant.

2. Si l'argument passé après `/enricher` contient déjà l'idée, utilise-le comme point de départ. Sinon, demande : "Quelle idée veux-tu ajouter au jeu ?"

3. Lis `COURS-BRIEF.md`, `SPECS/CONCEPT.md`, `SPECS/RULES.md`, `SPECS/ROADMAP.md` et, s'ils existent, `SPECS/GRAPHICS.md`, `SPECS/TECHNICAL.md` et `SPECS/POC-SPECS.md`.

4. **Affine l'idée**, une question à la fois : comment elle s'intègre à la boucle de jeu existante, ce qu'elle change concrètement pour le joueur, comment elle interagit avec les règles déjà en place dans `RULES.md` (est-ce qu'elle en contredit une ?).

5. **Où ça va.** Demande, une question à la fois : cet ajout fait partie du MVP à construire, c'est une piste pour la suite (jamais développée), ou l'étudiant veut vraiment l'inclure dans le POC lui-même ? Ne présume pas de la réponse — les trois options sont valables, mais si `SPECS/POC-SPECS.md` existe déjà, le POC n'y bouge pas tout seul : ça ne peut être que le choix explicite et assumé de l'étudiant. Si l'étudiant choisit le POC, avertis-le clairement que le POC doit rester minimal (voir `COURS-BRIEF.md`) et demande une confirmation explicite avant de continuer dans cette voie.

6. Met à jour `SPECS/CONCEPT.md` : ajoute l'idée à la section des mécaniques au-delà de la boucle de base.

7. Met à jour `SPECS/RULES.md` : ajoute les règles précises et chiffrées de ce nouvel élément, au même niveau de détail que le reste du fichier.

8. **Auto-vérification, comme dans `/specifier`.** Relis la section de `RULES.md` que tu viens d'ajouter en te mettant à la place d'un agent qui devrait la coder sans autre contexte : coûts, seuils, cas limites, interactions avec les règles existantes sont-ils tous couverts ? Présente les trous trouvés un par un, comble-les avec l'étudiant, puis mets à jour `RULES.md` en conséquence.

9. Met à jour `SPECS/ROADMAP.md` : ajoute l'élément dans la section actée à l'étape 5 (MVP ou suite). Si l'étudiant a choisi de l'inclure dans le POC, met aussi à jour `SPECS/POC-SPECS.md` (actions démontrées ou règles incluses, selon le cas) — et rappelle-lui qu'il faudra relancer `/asset-generator` et `/poc-generator` (ou reprendre le POC déjà codé) pour que le POC reflète réellement cet ajout.

10. Si l'idée a un impact visuel ou technique, demande si `SPECS/GRAPHICS.md` et/ou `SPECS/TECHNICAL.md` doivent être mis à jour en conséquence, et fais-le avec son accord.

11. Récapitule à l'étudiant tous les fichiers modifiés. S'il existe un `PRE-RENDU-CHECK.md` déjà produit, signale qu'il est maintenant potentiellement obsolète et qu'il vaut mieux relancer `/pre-rendu-check` avant le prochain rendu. Suggère aussi `/spec-reviewer` pour vérifier que cet ajout n'a pas introduit d'incohérence avec le reste de `SPECS/`.
