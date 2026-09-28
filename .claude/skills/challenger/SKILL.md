---
name: challenger
description: Reprend brainstorm.md, challenge chaque idée (forces/faiblesses), explore des variantes de l'idée qui se détache, et aide l'étudiant à trancher pour n'en retenir qu'une, par une session interactive. Produit idee-retenue.md.
user-invocable: true
argument-hint: "[optionnel : ta préférence de départ]"
---

# Challenger

## Objectif

Passer chaque idée de `brainstorm.md` au crible (points forts / points faibles), sentir la préférence de l'étudiant, et converger vers **une seule** idée retenue.

## Ce qui compte comme point fort / point faible

Ne juge pas au goût — appuie-toi sur ces critères (repris de `COURS-BRIEF.md`) pour qualifier chaque idée :

- **Lisibilité immédiate** : la mécanique se comprend-elle en dix secondes, sans explication ? (point fort si oui, faible si ça demande un tutoriel ou du texte à lire)
- **Un POC minuscule est-il possible** : peut-on en tirer une version "mode pub" en un ou deux prompts, sans construire tout le jeu ? (faible si l'idée n'a de sens qu'une fois complète)
- **Une vraie évolution vers le MVP** : existe-t-il une décision intéressante à ajouter pour le MVP (pas juste plus de contenu) ? (faible si la seule évolution possible est "plus de niveaux/plus de texte")
- **Charge de contenu** : l'idée demande-t-elle beaucoup de contenu à produire à la main (textes, images, cas particuliers) plutôt que de la mécanique ? (c'est un point faible : ça devient un travail de rédaction, pas de game design)
- **Risque de subjectivité ou de complexité** : le jugement du jeu est-il objectif (règles chiffrées, vérifiables) ou dépend-il d'une appréciation floue ? Une mécanique demande-t-elle un système compliqué à coder (multijoueur, IA, physique) ? (faible si oui)

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer. Pas de pavé listant plusieurs points d'un coup.

## Prérequis

Les fichiers `COURS-BRIEF.md` et `brainstorm.md` doivent exister à la racine du projet.

Si `COURS-BRIEF.md` est absent : refuse de continuer et dis à l'étudiant de le copier à la racine de son projet.
Si `brainstorm.md` est absent : refuse de continuer et dis à l'étudiant de lancer `/brainstormer` d'abord.

## Déroulé

1. Vérifie l'existence de `COURS-BRIEF.md` et `brainstorm.md`. Si l'un manque, arrête-toi ici avec le message de refus correspondant.

2. Lis `COURS-BRIEF.md` (contexte du cours, critères d'évaluation) et `brainstorm.md`.

3. **Sens la préférence avant de révéler les idées.** Les idées de `brainstorm.md` parlent forcément un peu à l'étudiant (il les a lui-même produites ou validées) : demander idée par idée "celle-ci te parle ?" n'apporte rien. Pose plutôt 2 à 4 questions de préférence générales sur le *type* de jeu, sans nommer explicitement à quelle idée du brainstorm elles renvoient — par exemple sur l'axe de mécanique (réflexe/timing, jugement/décision, gestion/accumulation) ou sur l'énergie recherchée (rapide et nerveux, posé et malin). Une question à la fois. Une fois un signal clair obtenu, dis à l'étudiant ton hypothèse : "Au vu de ta réponse, je pense que c'est [idée X] qui te parle le plus, on regarde ?" — c'est une hypothèse de travail, pas une décision.

4. **Passe ensuite toutes les idées en revue, une à la fois**, hypothèse comprise. Pour chaque idée : redonne sa description, ses points forts et ses points faibles, puis demande "Tu as quelque chose à ajouter ou à changer sur cette piste ?" (pas une question de garder/écarter — l'étudiant peut enrichir n'importe quelle idée à ce stade). Attends la réponse avant de passer à l'idée suivante.

5. Une fois toutes les idées passées en revue, redemande explicitement à l'étudiant s'il valide l'hypothèse posée à l'étape 3, ou s'il préfère une autre idée du lot :
   - S'il valide, poursuis avec cette idée.
   - S'il hésite entre deux ou plus, pose des questions de comparaison une par une (faisabilité, motivation, richesse du thème) jusqu'à ce qu'une idée se détache.

6. **Explore des variantes de l'idée retenue**, avant de la figer. Contrairement au brainstorm (qui doit rester sur des pistes différentes entre elles), ce n'est plus le moment de chercher une idée différente : c'est le moment de creuser celle-là sous plusieurs angles. Une à la fois, propose par exemple : un rôle inversé, une escalade de difficulté/complexité, un angle narratif différent sur la même mécanique. Après chaque variante proposée, demande si elle enrichit l'idée ou si l'étudiant préfère rester sur la version simple — il peut aussi explorer plusieurs variantes ou, à l'inverse, écourter l'exploration et forcer la validation directe d'une variante qui lui plaît déjà. Deux ou trois variantes suffisent au total.

7. Ajoute les variantes explorées (retenues ou écartées, avec la raison) à `brainstorm.md`, sous l'idée concernée, avant de produire `idee-retenue.md`.

8. Une fois l'idée retenue confirmée par l'étudiant (version simple ou enrichie d'une variante), écris `idee-retenue.md` à la racine du projet, avec :
   - L'idée retenue (reprise et éventuellement affinée par les ajouts et variantes explorées)
   - Ses points faibles connus : les pièges qui pourraient faire sortir le projet du sujet, et les risques de partir sur quelque chose de trop compliqué

9. Confirme à l'étudiant que `idee-retenue.md` est prêt et indique l'étape suivante : `/specifier`.
