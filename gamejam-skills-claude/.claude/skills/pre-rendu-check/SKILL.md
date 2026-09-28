---
name: pre-rendu-check
description: Relit tous les documents produits par les skills précédents et challenge leur cohérence et leur faisabilité avant le rendu, de façon interactive. Doit s'exécuter avant asset-generator.
user-invocable: true
argument-hint: ""
---

# Pre-rendu check

## Objectif

Vérifier, avant le rendu, que l'ensemble des documents produits dans `SPECS/` (`CONCEPT.md`, `RULES.md`, `GRAPHICS.md`, `TECHNICAL.md`, `ROADMAP.md`, `POC-SPECS.md`, `AGENTIC-WORKFLOW.md`) sont cohérents entre eux et respectent les attentes du rendu 1. Produire `PRE-RENDU-CHECK.md`.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer. Signale un point de vigilance à la fois, jamais une liste de problèmes d'un coup.

## Prérequis

Le fichier `COURS-BRIEF.md` et les sept fichiers `SPECS/CONCEPT.md`, `SPECS/RULES.md`, `SPECS/GRAPHICS.md`, `SPECS/TECHNICAL.md`, `SPECS/ROADMAP.md`, `SPECS/POC-SPECS.md`, `SPECS/AGENTIC-WORKFLOW.md` doivent tous exister.

Si l'un manque : refuse de continuer et indique à l'étudiant quel skill lancer pour le produire.

## Déroulé

1. Vérifie l'existence de `COURS-BRIEF.md` et des sept fichiers `SPECS/` listés ci-dessus. Si l'un manque, arrête-toi ici avec le message de refus.

2. Lis `COURS-BRIEF.md` (attentes exactes et critères d'évaluation du rendu 1) et les sept fichiers `SPECS/`.

3. Cherche activement les incohérences et les risques, par exemple :
   - Le POC reste-t-il volontairement petit (`ROADMAP.md`, `POC-SPECS.md`), ou dérive-t-il vers un MVP déguisé ?
   - `POC-SPECS.md` démontre-t-il bien une boucle de succès **et** une boucle d'échec clairement distinctes ?
   - `POC-SPECS.md` contient-il des éléments décoratifs (texte, dialogue) qui ne servent pas directement à comprendre la mécanique centrale ?
   - `TECHNICAL.md` (stack, game state) permet-il vraiment de réaliser ce qui est décrit dans `RULES.md` ?
   - `TECHNICAL.md` propose-t-il un backend (serveur, API, base de données distante) ? Le projet est front-end only ; toute sauvegarde de données doit passer par `localStorage`/`IndexedDB`.
   - La direction graphique de `GRAPHICS.md` est-elle compatible avec la stack retenue, et cohérente avec l'interface simplifiée éventuellement décidée dans `POC-SPECS.md` ?
   - `AGENTIC-WORKFLOW.md` décrit-il bien la méthode pour construire le **MVP** (pas le POC, déjà construit), et couvre-t-il les points les plus risqués sans se perdre en sophistication inutile ?
   - Le jeu sera ouvert sans explication au rendu final : est-ce que ce qui est décrit se comprend bien dans les dix premières secondes ?

4. Présente chaque point de vigilance trouvé un par un : observation courte + question ("Tu confirmes que tu gardes ça, ou on ajuste ?"). Attends la réponse avant de passer au point suivant.

5. Si l'étudiant décide d'ajuster un point, propose de mettre à jour le fichier concerné (avec son accord) plutôt que de laisser l'incohérence en l'état.

6. Une fois tous les points passés en revue, écris `PRE-RENDU-CHECK.md` : liste des points soulevés, décision prise pour chacun (gardé tel quel / ajusté), et un avis global sur la faisabilité du projet pour le rendu.

7. Confirme à l'étudiant que `PRE-RENDU-CHECK.md` est prêt et indique l'étape suivante : `/asset-generator`.
