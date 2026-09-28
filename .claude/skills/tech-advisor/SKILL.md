---
name: tech-advisor
description: Challenge le choix de stack technique de l'étudiant et construit avec lui une ébauche de game state, à partir de RULES.md, CONCEPT.md et GRAPHICS.md. Produit TECHNICAL.md.
user-invocable: true
argument-hint: "[optionnel : la stack que tu as en tête]"
---

# Tech advisor

## Objectif

Décider ensemble d'une stack technique réaliste, et esquisser une première version (non définitive) du game state. Produire `SPECS/TECHNICAL.md`.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer.

## Prérequis

Les fichiers `COURS-BRIEF.md`, `SPECS/CONCEPT.md`, `SPECS/RULES.md` et `SPECS/GRAPHICS.md` doivent exister.

Si `COURS-BRIEF.md` est absent : refuse de continuer et dis à l'étudiant de le copier à la racine de son projet.
Si l'un des fichiers `SPECS/` manque : refuse de continuer et dis à l'étudiant de lancer l'étape manquante (`/specifier` ou `/art-director`) d'abord.

## Déroulé

1. Vérifie l'existence de `COURS-BRIEF.md`, `SPECS/CONCEPT.md`, `SPECS/RULES.md` et `SPECS/GRAPHICS.md`. Si l'un manque, arrête-toi ici avec le message de refus correspondant.

2. Lis `COURS-BRIEF.md` et les trois fichiers `SPECS/`.

3. Si l'étudiant n'a pas donné de stack en argument, demande :

   > "Quelle stack technique tu as en tête pour ce projet ?"

4. Challenge son choix par des questions une par une : est-ce qu'il/elle la connaît déjà ou l'apprend en même temps, est-ce que la stack est adaptée aux règles définies dans `SPECS/RULES.md` (temps réel ? multijoueur ? rendu graphique lourd ?), le choix repose-t-il sur un vrai critère (pas juste "c'est fait pour ça").

5. **Contrainte non négociable : pas de backend.** Le projet reste front-end web (voir `COURS-BRIEF.md`). Si l'étudiant propose un serveur, une API à coder, une base de données distante ou de l'authentification serveur, dis-le explicitement et redirige : si le besoin réel est de sauvegarder des données (score, progression, réglages), la solution est le stockage local du navigateur (`localStorage` ou `IndexedDB`), jamais un backend.

6. Fais évoluer le choix ensemble si besoin, jusqu'à une stack que l'étudiant assume et que tu juges réaliste.

7. Une fois la stack actée, propose une ébauche de game state (structure de données représentant l'état du jeu) basée sur `SPECS/CONCEPT.md` et `SPECS/RULES.md`. Si `RULES.md` implique de sauvegarder quelque chose entre deux sessions, précise dans cette ébauche que ça passera par `localStorage`/`IndexedDB`. Présente-la et demande un retour ; ajuste-la par les échanges plutôt que de l'imposer. Précise explicitement que ce game state n'est pas figé.

8. Écris `SPECS/TECHNICAL.md` : stack retenue (et pourquoi), ébauche de game state, stratégie de stockage local si besoin, points de vigilance technique.

9. Confirme à l'étudiant que `SPECS/TECHNICAL.md` est prêt et indique l'étape suivante : `/roadmapper`.
