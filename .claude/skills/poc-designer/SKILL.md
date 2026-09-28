---
name: poc-designer
description: Recentre le jeu complet décrit dans CONCEPT.md/RULES.md sur ce que le POC du rendu 1 doit démontrer (actions clés, boucle de succès, boucle d'échec, interface minimale), avec la liste explicite des règles incluses et exclues. Produit SPECS/POC-SPECS.md.
user-invocable: true
argument-hint: ""
---

# POC designer

## Objectif

`CONCEPT.md` et `RULES.md` décrivent le jeu complet, pas seulement le POC (c'est voulu : voir `/specifier`). Le POC, lui, ne doit volontairement couvrir qu'une petite tranche de ce jeu. Ce skill fait ce recentrage : il décrit ce que le POC démontre, et surtout rend explicite, règle par règle, ce qui est dedans et ce qui n'y est pas. Produire `SPECS/POC-SPECS.md`.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer.

## Prérequis

Les fichiers `COURS-BRIEF.md` et `SPECS/ROADMAP.md` doivent exister.

Si `COURS-BRIEF.md` est absent : refuse de continuer et dis à l'étudiant de le copier à la racine de son projet.
Si `SPECS/ROADMAP.md` est absent : refuse de continuer et dis à l'étudiant de lancer `/roadmapper` d'abord.

## Déroulé

1. Vérifie l'existence de `COURS-BRIEF.md` et `SPECS/ROADMAP.md`. Si l'un manque, arrête-toi ici avec le message de refus correspondant.

2. Lis `COURS-BRIEF.md` (rappel : le POC est un critère mécanique — lisible en dix secondes, jouable en version ultra-minimale, aucune obligation de décor clickbait), `SPECS/ROADMAP.md` (section POC), `SPECS/CONCEPT.md`, `SPECS/RULES.md` et, s'il existe, `SPECS/GRAPHICS.md`.

3. **Actions démontrées.** Demande quelles actions le joueur doit pouvoir faire dans le POC (1 à 3 actions maximum — pas plus). Rappelle que le POC se concentre sur la mécanique centrale, pas sur l'intégralité de `RULES.md`.

4. **Boucle de succès.** Demande, une question à la fois, la séquence d'actions qui mène à un état de réussite visible par le joueur (qu'est-ce qui se passe à l'écran quand ça marche).

5. **Boucle d'échec.** Demande de même la séquence qui mène à un état d'échec visible. Explique pourquoi c'est important : montrer les deux boucles côte à côte, c'est ce qui permet de comprendre la mécanique par l'exemple ("si je fais ça c'est correct, si je fais ça c'est une erreur"), sans avoir besoin de texte explicatif.

6. **Passe RULES.md en revue, section par section, sans en sauter aucune.** Pour chaque section/élément de `RULES.md`, demande à l'étudiant s'il fait partie du POC ou non, et note explicitement sa décision (inclus ou exclu) — même les éléments évidemment hors POC doivent apparaître dans la liste, pas seulement être omis en silence. Encourage à exclure largement : le POC n'est pas une validation du jeu entier. À la fin de cette étape, chaque section de `RULES.md` doit avoir un statut clair.

7. **Interface minimale.** Demande si la direction graphique complète de `GRAPHICS.md` (si elle existe) est nécessaire pour ce POC, ou si une interface simplifiée (formes et couleurs à la place des assets finaux, pas de menu, pas d'écran d'accueil) suffit à démontrer la mécanique aussi clairement. Insiste sur l'absence de texte ou de dialogue décoratif : rien qui ne serve pas directement à comprendre la mécanique centrale.

8. Écris `SPECS/POC-SPECS.md` :
   - **Description du POC** : quelques phrases qui recentrent `CONCEPT.md` sur ce que cette démo précise montre — pas une redite du concept complet.
   - **Actions démontrées** (la liste courte actée à l'étape 3)
   - **Boucle de succès** (séquence, état final visible)
   - **Boucle d'échec** (séquence, état final visible)
   - **Règles incluses dans le POC** : la liste des règles de `RULES.md` (ou leur version simplifiée pour le POC) qui s'appliquent réellement
   - **Règles exclues du POC** : la liste de toutes les autres sections/règles de `RULES.md`, explicitement marquées comme hors POC (réservées au MVP ou à la suite)
   - **Interface** : ce qui est simplifié ou absent par rapport à `GRAPHICS.md`
   - **Checklist de vérification** : quelques phrases du type "le POC démontre X sans avoir besoin de Y", utilisables telles quelles pour vérifier le POC une fois construit.

9. Confirme à l'étudiant que `SPECS/POC-SPECS.md` est prêt et indique l'étape suivante : `/pre-rendu-check`. Rappelle en passant que `SPECS/AGENTIC-WORKFLOW.md` (via `/workflow-designer`, un skill à part, utilisable à tout moment depuis `/roadmapper`) doit aussi exister avant `/pre-rendu-check`, s'il n'est pas déjà prêt.
