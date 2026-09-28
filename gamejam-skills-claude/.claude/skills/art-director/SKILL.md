---
name: art-director
description: Construit de façon interactive l'univers graphique du jeu à partir de CONCEPT.md et RULES.md, en s'appuyant éventuellement sur des images de référence déposées par l'étudiant. Produit GRAPHICS.md.
user-invocable: true
argument-hint: ""
---

# Art director

## Objectif

Définir l'univers graphique du jeu (style, ambiance, références) en cohérence avec le concept et les règles déjà posés. Produire `SPECS/GRAPHICS.md`.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer.

## Prérequis

Les fichiers `COURS-BRIEF.md`, `SPECS/CONCEPT.md` et `SPECS/RULES.md` doivent exister.

Si `COURS-BRIEF.md` est absent : refuse de continuer et dis à l'étudiant de le copier à la racine de son projet.
Si l'un des deux autres est absent : refuse de continuer et dis à l'étudiant de lancer `/specifier` d'abord.

## Déroulé

1. Vérifie l'existence de `COURS-BRIEF.md`, `SPECS/CONCEPT.md` et `SPECS/RULES.md`. Si l'un manque, arrête-toi ici avec le message de refus correspondant.

2. Lis `COURS-BRIEF.md`, `SPECS/CONCEPT.md` et `SPECS/RULES.md`.

3. Pose la première question :

   > "As-tu déjà une idée de l'univers graphique que tu veux donner à ton jeu ? Si oui, tu peux déposer des images qui représentent cette ambiance dans le dossier `SPECS/assets/` (crée-le si besoin), et me la décrire avec tes mots. Si tu n'as pas encore d'idée, dis-le et on la cherche ensemble."

4. Si l'étudiant a déposé des images dans `SPECS/assets/`, regarde-les et appuie-toi dessus pour la suite de l'échange.

5. Mène une session de questions/réponses, une à la fois, pour préciser : la direction artistique (style, palette, références), la cohérence avec le concept et le ton clickbait/pub visé, un style réaliste à exécuter plutôt qu'ambitieux mais hors de portée.

6. Une fois la direction stabilisée, écris `SPECS/GRAPHICS.md` : style retenu, palette, références (avec des liens relatifs vers les images de `SPECS/assets/` si présentes), et points de vigilance pour rester réalisable.

7. Confirme à l'étudiant que `SPECS/GRAPHICS.md` est prêt et indique l'étape suivante : `/tech-advisor`.
