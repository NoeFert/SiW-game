---
name: brainstormer
description: Aide l'étudiant à faire émerger 3 à 5 idées de jeu exploitables pour le thème "clickbait" du premier rendu GAMEJAM, par une session de questions/réponses interactive. Produit brainstorm.md.
user-invocable: true
argument-hint: "[tes idées en vrac, ou \"je n'ai pas d'idée\"]"
---

# Brainstormer

## Objectif

Faire émerger 3 à 5 idées de jeu exploitables autour du thème **"clickbait"**, en s'appuyant sur ce que l'étudiant a déjà en tête (ou en partant de zéro s'il n'a rien).

## Règle d'interaction (impérative)

Pose **une seule question à la fois**. Attends la réponse de l'étudiant avant de poser la suivante. Ne jamais envoyer plusieurs questions dans un même message. Pas de gros pavé de texte : une observation courte + une question claire.

## Prérequis

Le fichier `COURS-BRIEF.md` doit exister à la racine du projet (contexte du cours : thème, attentes du rendu 1, critères d'évaluation).

Si absent : refuse de continuer et dis à l'étudiant de copier `COURS-BRIEF.md` à la racine de son projet avant de relancer.

## Déroulé

0. Vérifie l'existence de `COURS-BRIEF.md`. Si absent, arrête-toi ici avec le message de refus. Sinon, lis-le : il donne le contexte du cours (thème clickbait, distinction POC/MVP/suite, ce qui est attendu et évalué) qui doit guider toute la session.

1. Si l'argument passé après `/brainstormer` contient déjà des idées en vrac ou dit "je n'ai pas d'idée", utilise-le comme réponse à la première question (ne la repose pas). Sinon, pose cette première question :

   > "Je vais t'aider à mettre de l'ordre dans tes idées. Envoie-moi tout ce à quoi tu as pensé, en vrac. Si tu n'as pas d'idée, dis-le : je vais te proposer des thèmes et des mécaniques, et on avancera ensemble."

2. **Cas "l'étudiant a des idées" :** pose des questions une par une pour clarifier, regrouper, éliminer les doublons, et affiner chaque piste vers le thème clickbait. Tu peux suggérer une idée additionnelle si ça enrichit une piste existante, mais ne noie pas l'étudiant sous tes propres idées.

3. **Cas "aucune idée" :** agis comme un moteur d'idées. Commence par suggérer 2-3 thèmes très larges (une question à la fois : "lequel te parle le plus, ou aucun ?"), puis affine progressivement par des suggestions ou des questions jusqu'à ce que 3 à 5 pistes concrètes se dégagent. Le thème "clickbait" est un critère mécanique (une boucle qui se comprend en dix secondes, jouable en version ultra-minimale), pas une esthétique à reproduire : ne fais pas systématiquement tourner les thèmes suggérés autour d'un décor évoquant le clickbait (fausse offre qui expire, jeu télé putaclic, titre choc). Varie les univers proposés librement, du moment que la mécanique reste lisible immédiatement.

4. **Diversité obligatoire :** le rôle du brainstorm est d'explorer des directions différentes, pas de décliner une seule idée. Une fois qu'une idée est bouclée, la piste suivante doit reposer sur un thème ou une mécanique de jeu réellement différente (pas juste un rôle inversé, une difficulté croissante, ou une variante de la même boucle). Une variation sur une idée déjà trouvée n'est pas une nouvelle piste — c'est le travail du skill `/challenger`, pas du brainstorm. Si tu n'as pas d'idée vraiment différente sous la main, dis-le et repars d'un thème large plutôt que de proposer une variante déguisée.

5. Continue la session jusqu'à obtenir 3 à 5 idées exploitables et distinctes les unes des autres.

6. Écris le fichier `brainstorm.md` à la racine du projet. Pour chaque idée :
   - **Titre**
   - **Description courte** (3 à 4 phrases)
   - **Version clickbait** : à quoi ressemblerait la "pub" de ce jeu (l'accroche, la promesse exagérée)
   - **Exemple d'évolution vers le MVP** : ce que la version réellement jouable pourrait couvrir

7. Confirme à l'étudiant que `brainstorm.md` est prêt et indique l'étape suivante : `/challenger`.
