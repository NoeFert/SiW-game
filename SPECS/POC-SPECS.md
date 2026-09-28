# POC-SPECS.md — Version clickbait (Rendu 1)

`CONCEPT.md` et `RULES.md` décrivent le jeu complet. Ce fichier recentre sur ce que le POC (la version clickbait, `technical.md` 5.6) démontre, et liste explicitement, section par section, les règles de `RULES.md` incluses et exclues.

## Description du POC

Une bataille courte en trois zones, où le joueur ne fait que trois gestes : **déployer** ses monstres, **mettre en pause**, et **faire fuir** une unité blessée. Tout le reste est autonome : les unités avancent, contournent les obstacles et se battent seules.

La mécanique démontrée : **un budget de présence limité, et des unités qu'on perd pour de bon**. Chaque monstre déployé coûte des points de présence (plafond de 150). Une unité blessée qu'on fait fuir revient dans la liste et rend ses points ; une unité qu'on laisse mourir disparaît définitivement et alourdit le bilan des pertes.

La première zone apprend à jouer ; passer à la zone suivante est une petite récompense ; l'écran de victoire, avec son bilan des pertes, n'arrive qu'après la troisième zone.

## Actions démontrées

1. **Déployer** une unité par glisser-déposer dans la moitié gauche du terrain, dans la limite des points de présence.
2. **Faire fuir** une unité : bouton Commandes → ordre Fuir → choix de l'unité. C'est le seul ordre disponible dans le POC.
3. **Mettre en pause / relancer** la bataille (bouton ⏸ / ▶, barre Espace).

## Boucle de succès

1. Le joueur déploie quelques unités dans sa moitié gauche. La jauge de présence se remplit.
2. Ses unités avancent seules et engagent l'ennemi.
3. Une unité passe sous 50 % de PV (barre de vie jaune, puis rouge). Le joueur met en pause, ordonne la fuite, relance.
4. L'unité atteint un bord et quitte le terrain : elle **réapparaît dans la liste de déploiement**, avec ses PV réduits, et ses points de présence sont rendus à la jauge.
5. Le joueur redéploie ces points ; la vague ennemie est éliminée.

**États visibles :**
- **Fin de chaque zone** : l'armée survivante part vers la droite et entre dans la zone suivante (« Le mur », puis « Le fort »). Petite récompense.
- **Fin de la zone 3** : écran de victoire avec le **bilan des pertes** (unités tuées par espèce, ou « Aucune perte ! »).

## Boucle d'échec

**Échec local (démontré en priorité), miroir de la boucle de succès :**
1. Une unité passe sous 50 % de PV ; le joueur ne la fait pas fuir.
2. Elle meurt : elle **disparaît du terrain et ne revient jamais dans la liste**. Ses points de présence sont libérés, mais la copie est perdue.
3. Visible à la fin : cette perte figure dans le bilan des pertes.

**Défaite (sanction ultime) :**
1. Le joueur n'a plus aucune unité sur le terrain ni en réserve, **ou** il n'a plus d'unité sur le terrain et ne redéploie pas avant la fin du compte à rebours de 15 s.
2. Visible : écran de défaite avec « Réessayer », qui **relance toute la bataille depuis la zone 1**.

## Règles incluses dans le POC

| Section `RULES.md` | Statut | Détail |
|---|---|---|
| 1. Terrain | Incluse | Grille 24 × 14, une unité par case, 16 obstacles de la bataille 01 (terrain de la zone 1). |
| 2. Déploiement | Incluse en entier | Moitié gauche, pause d'interaction pendant le glisser-déposer, plafond vivant de 150, une seule [Légendaire] à la fois, copies limitées (tuée = perdue, en fuite = retour en réserve avec PV réduits), IA à droite. |
| 3. Mouvement | Incluse en entier | 8 directions sans couper les coins d'obstacles, distances en cases, cible la plus proche et départages, vitesse propre, bloc rigide 2×2, [Vol] ignore les obstacles. |
| 4. Combat (4.1 à 4.5) | Incluse en entier | Temps continu, dégâts simultanés, coup fatal partagé, engagement au corps-à-corps, adjacence 2×2, mort définitive, attaque à distance (portée, pas de ligne de vue, portée minimale, recul, cas d'Athos et de Fafnir). |
| 5. Commandes du joueur | **Simplifiée** | Seul l'ordre **Fuir** est disponible (voie 1 : Commandes → Fuir → unité), avec toutes ses règles : fuite toujours possible, dernière attaque gratuite de chaque ennemi engagé, bord atteignable le plus proche, sortie immédiate depuis un bord, riposte si aucun bord n'est atteignable, poursuite possible, annulation sans consommer le cooldown. Pause d'interaction à l'ouverture de la barre. |
| 5.1 Limitation des commandes | **Simplifiée** | Cooldown de 5 s de temps de bataille, gelé pendant les pauses. |
| 5.2 Pauses | Incluse | Pause principale (⏸ / ▶, Espace), pause d'interaction (déploiement, commande), gel de tous les compteurs, une commande par pause principale, déploiements multiples, le jeu reste en pause après un geste. Gel du tutoriel pour les étapes figées du tutoriel clickbait. |
| 6.1 Aptitudes automatiques | Incluse | Coup critique de Fafnir, Frappe paralysante et Soif de sang d'Athos (`units.md`), règles de comptage des attaques. |
| 7. IA — principes généraux | Incluse | Script à l'instant absolu, aucune ressource dynamique, comportement autonome identique au joueur, plafond vivant de 150. |
| 7.1 Script de la bataille 01 | **Simplifiée** | Utilisé seulement comme script de la phase 1 (sans Fafnir quand l'IA joue les Wyrms). |
| 7.2 Entrée par le bord droit | Incluse | Rangée choisie selon la cible stratégique (renfort, puis éradication), vagues sur des rangées voisines. |
| 7.3 Bataille en plusieurs phases | Incluse | Trois zones (champ, « Le mur », « Le fort ») et leurs scripts, transition figée, conservation des morts, des PV et de la réserve, victoire à la fin de la phase 3 sans compte à rebours. |
| 8.1 Victoire immédiate | **Simplifiée** | Victoire selon 7.3 ; défaite si le joueur n'a plus d'unité sur le terrain ni en réserve ; match nul en cas d'élimination mutuelle au même instant. |
| 8.2 Terrain vide avec réserves | **Simplifiée** | Compte à rebours de 15 s et défaite à son expiration. |
| 9. Roster | Incluse en entier | Deux factions au choix, l'IA joue l'autre ; 3 unités par faction avec les stats et copies de `units.md`. |

Tutoriel : **tutoriel clickbait** (`CLICKBAIT_TUTORIAL`, `technical.md` 5.5) — déployer (bataille figée), combat autonome, points de présence (autonome, 6 s), puis battre en retraite 6 s après le début de la phase 2 (ouvrir la barre de commandes, puis ordonner Fuir à une unité ; bataille figée).

## Règles exclues du POC

| Section / règle `RULES.md` | Renvoyée à |
|---|---|
| 5. Ordre **Aller** | MVP |
| 5. Ordre **Attaquer** | MVP |
| 5. **Voie 2 (raccourci)** de sélection d'une commande (déduit Aller ou Attaquer) | MVP |
| 5.1 Diminution du cooldown avec le niveau du joueur | Suite (déjà hors v1) |
| 5.2 Pause d'interaction pendant la confirmation d'abandon | MVP (suit le bouton Abandonner) |
| 6.2 Aptitudes à usage limité | Suite (aucune unité v1 n'en a) |
| 7.1 Bataille 01 en tant que bataille à part entière (une seule phase) | MVP |
| 7.3 Zone de réserve « Les trois couloirs » | Suite |
| 8.1 Réserves de l'IA dans la bataille 01 (victoire après 15 s) | MVP |
| 8.2 **Bouton Abandonner** (avec confirmation) | MVP |
| 10. Valeurs à définir | Sans objet (section vide) |

Hors `RULES.md`, également absents du POC (voir `roadmap.md`) : tutoriel de départ complet (`STARTER_TUTORIAL`), écran d'accueil, écran de gestion de civilisation, toute sauvegarde (rien n'est persisté).

## Interface

**Écrans** : introduction (bouton **Clickbait** actif, **MVP** grisé) → choix de faction → bataille en trois zones → victoire avec bilan des pertes (« Continuer » ramène au choix de faction) ou défaite avec « Réessayer ».

**Conservé de `GRAPHICS.md`** (les assets finaux existent déjà et sont branchés) :
- sprites des six unités, des deux souverains, rochers et fond de bataille (retourné pour « Le mur ») ;
- barres de vie vert → jaune → rouge (indispensables pour repérer l'unité à faire fuir) ;
- désaturation du terrain pendant la pause ;
- couleur signature de chaque faction sur la jauge de présence et les projectiles ;
- signaux d'aptitudes (« COUP CRITIQUE ! », « Raté ! », « +40 », tremblement d'écran) : déjà en place, sans rôle dans les boucles.

**Retiré ou simplifié :**
- barre de commandes réduite à l'ordre **Fuir** ;
- **bouton Abandonner masqué** (présent dans le code du jeu normal) ;
- UI autour du terrain en **8bitcn, à titre provisoire** : choix de rapidité, susceptible d'être remplacé par un autre style ;
- aucun texte décoratif en dehors des messages du tutoriel clickbait et des écrans de fin.

## Checklist de vérification

- Le POC démontre que les unités se battent seules sans que le joueur ait à les diriger.
- Le POC démontre le plafond de présence : la jauge bloque un déploiement qui dépasserait 150, sans texte en dehors du tutoriel.
- Le POC démontre qu'une unité en fuite revient dans la liste avec ses PV réduits et rend ses points, sans avoir besoin des ordres Aller ou Attaquer.
- Le POC démontre qu'une unité tuée ne revient jamais et apparaît dans le bilan des pertes.
- Le POC démontre la pause (terrain désaturé, compteurs gelés), pendant laquelle on peut encore déployer et faire fuir.
- Le POC démontre le passage de zone comme récompense, sans écran intermédiaire.
- Le POC démontre la défaite (plus d'unités, ou compte à rebours de 15 s expiré) et relance depuis la zone 1 avec « Réessayer ».
- Le POC ne montre ni Aller, ni Attaquer, ni Abandonner, ni aucune sauvegarde.
