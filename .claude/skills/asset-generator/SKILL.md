---
name: asset-generator
description: Prépare et fait valider tous les visuels (images, icônes) nécessaires au POC avant de lancer poc-generator, à partir de POC-SPECS.md et GRAPHICS.md. Produit SPECS/POC-ASSETS.md.
user-invocable: true
argument-hint: ""
---

# Asset generator

## Objectif

Tout ce qui est image ou icône dans le POC doit exister comme vrai fichier et être validé par l'étudiant avant que `/poc-generator` ne commence à coder — pas de référence à une image qui n'existe pas, pas d'asset décidé après coup. Produire `SPECS/POC-ASSETS.md`.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer.

## Prérequis

Le fichier `PRE-RENDU-CHECK.md` doit exister à la racine du projet.

Si absent : refuse de continuer et dis à l'étudiant de lancer `/pre-rendu-check` d'abord.

## Déroulé

1. Vérifie l'existence de `PRE-RENDU-CHECK.md`. Si absent, arrête-toi ici avec le message de refus.

2. Lis `SPECS/POC-SPECS.md` (section interface minimale) et `SPECS/GRAPHICS.md`. Regarde aussi ce qui existe déjà dans `SPECS/assets/`.

3. **Liste les visuels réellement nécessaires.** Passe en revue l'interface décrite dans `POC-SPECS.md` élément par élément, une question à la fois : est-ce que cet élément a besoin d'un vrai fichier image/icône, ou est-ce qu'une forme/couleur simple (un carré CSS, une couleur unie) suffit ? Rappelle que `POC-SPECS.md` a déjà acté une interface minimale : pousse vers l'option la plus simple à chaque fois que c'est possible, ne fabrique pas de besoin d'asset qui n'existait pas.

4. **Pour chaque élément qui a vraiment besoin d'un fichier image/icône**, demande à l'étudiant comment il/elle veut l'obtenir :
   - réutiliser une image déjà présente dans `SPECS/assets/` (déposée pendant `/art-director`)
   - en créer une simple elle/lui-même et la déposer dans `SPECS/assets/`
   - si un outil de génération d'image est disponible dans cette session, proposer d'en générer une version simple et la déposer dans `SPECS/assets/`

   Si aucun outil de génération d'image n'est disponible, dis-le clairement à l'étudiant plutôt que d'improviser un placeholder texte fait passer pour une image.

5. Vérifie que chaque fichier annoncé existe réellement sur le disque avant de le considérer comme prêt. Ne coche jamais un asset sur la seule base de la description de l'étudiant.

6. Une fois tous les visuels nécessaires réunis comme fichiers réels, liste-les à l'étudiant (chemin + usage prévu dans le POC) et demande une validation explicite avant de continuer.

7. Écris `SPECS/POC-ASSETS.md` : pour chaque élément d'interface du POC, soit "forme/couleur simple, pas d'asset" soit le chemin du fichier utilisé, avec sa provenance (repris de `SPECS/assets/`, créé par l'étudiant, généré).

8. Confirme à l'étudiant que `SPECS/POC-ASSETS.md` est prêt et indique l'étape suivante : `/poc-generator`.
