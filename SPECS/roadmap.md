# ROADMAP.md

Deux parties : le MVP (scope v1), puis la suite (scope v2+). Anciennement `scope-jeu-strategie.md`, déplacé et mis à jour dans `SPECS/`.

---

## Scope v1 — MVP (moteur de bataille)

**Objectif :** valider que le cœur du gameplay (unités autonomes + contrôle limité du joueur) est jouable et amusant, avant d'investir dans la couche méta.

### Inclus
- Une grille avec obstacles (voir `rules.md` section 1)
- **Deux factions jouables** (Souveraine des Wyrms et Souverain des Morts-Vivants), roster réduit de 3 unités chacune (basique, [Vol], [Légendaire]). Le joueur choisit sa faction en début de partie ; l'IA contrôle automatiquement l'autre — pour éviter que le joueur affronte sa propre armée en miroir (voir `rules.md` section 9 et `units.md`)
- Déploiement avec pause tactique, plafond vivant de points de présence, quantité de copies limitée par unité (voir `rules.md` section 2)
- Mouvement autonome + pathfinding + règles d'engagement corps-à-corps et à distance (voir `rules.md` sections 3 et 4)
- Combat autonome (dégâts, PV, mort définitive)
- Aptitudes automatiques propres à certaines unités (voir `rules.md` section 6 et `units.md`)
- Commandes du joueur (attaquer, aller à, fuir), déclenchées via un bouton "Commandes" dédié qui met le jeu en pause, avec cooldown de 5 secondes en temps de bataille (voir `rules.md` section 5)
- IA adverse scriptée, une seule bataille pour la v1, script symétrique selon la faction jouée par l'IA (voir `rules.md` section 7)
- Conditions de fin de bataille : victoire immédiate, cas d'égalité, ou compte à rebours de 15s si le terrain adverse est vide mais qu'il reste des réserves (voir `rules.md` section 8)
- **Enchaînement d'écrans complet** (voir `technical.md` section 5) : écran de choix de faction (une seule fois, au tout début) → écran de bataille (canevas Phaser + sidebar de déploiement React) → à l'issue de la bataille, écran de récompense (victoire) ou écran de défaite avec bouton "réessayer" → après la victoire de cette première bataille, écran d'accueil affichant la faction choisie par le joueur
- **Choix de faction persistant** (localStorage) : le choix initial du joueur, et le fait d'avoir remporté la première bataille, survivent à un rechargement de page — exception ciblée à l'exclusion générale de la persistance ci-dessous (voir note dans "Exclus")

### Exclus (renvoyés au scope v2+)
- Gacha / monnaie d'invocation
- Traits (design doc section 6) et ses deux générateurs
- Personnalisation (noms, amélioration de stats, achat de keywords)
- Système de coût à 3 niveaux (design doc section 9) — en v1, coût fixe simple par unité
- Classes/synergies (design doc section 10.1) et arbre de renforcement (design doc section 10.2)
- Aptitudes à usage limité activées par le joueur (design doc section 4.4 / `rules.md` 6.2) — définies dans les règles, mais aucune unité du roster v1 n'en possède
- **Progression sauvegardée complète** (inventaire, XP, amélioration d'unités, historique de batailles) — seule exception : la faction choisie et le fait d'avoir gagné la première bataille sont conservés via localStorage (voir "Inclus" ci-dessus), pour permettre l'écran d'accueil sans redemander le choix de faction à chaque rechargement. Ce n'est pas un système de sauvegarde généralisé
- Roster étendu au-delà des 3 unités par faction, et factions supplémentaires au-delà des deux premières
- **Plusieurs niveaux/batailles enchaînés** — le design prévoit que les batailles se répéteront sur plusieurs niveaux dans le futur (voir `technical.md` section 5), mais la v1 ne contient qu'une seule bataille ; aucune sélection de niveau, aucun système de progression entre batailles n'est construit maintenant

---

## Scope v2+ — Couche méta

À traiter une fois le moteur de bataille validé en pratique.

- Gacha / monnaie d'invocation
- Système de traits (design doc section 6), deux générateurs (vétérance normale / danger-négligence)
- Personnalisation des unités (design doc section 8)
- Système de coût en points de présence à 3 niveaux (design doc section 9)
- Classes/rôles et synergies (design doc section 10.1)
- Arbre de renforcement par unité (design doc section 10.2)
- Aptitudes à usage limité pour de nouvelles unités
- Progression sauvegardée complète (au-delà du choix de faction déjà persistant en v1)
- Plusieurs niveaux/batailles enchaînés, avec sélection de niveau depuis l'écran d'accueil
- Roster étendu (plus d'unités par faction) et factions supplémentaires

---

## Décisions tranchées pour le scope v1

| Point | Décision |
|---|---|
| Découpage du temps de bataille | Temps continu (delta-time) ; chaque unité agit selon son propre timer de vitesse d'attaque |
| Dégâts simultanés (même frame) | Toutes les attaques du frame sont calculées puis appliquées ensemble — pas d'ordre d'initiative |
| Limitation des commandes | Bouton "Commandes" dédié qui met le jeu en pause ; cooldown de 5 secondes en temps de bataille entre deux activations |
| Retraite d'une unité engagée | Toujours possible immédiatement ; l'ennemi engagé peut placer une dernière attaque au désengagement |
| Adjacence d'une unité 4-cases | Adjacente dès qu'une de ses 4 cases touche une case adjacente à la cible |
| Pathfinding d'une unité 4-cases | Bloc 2×2 rigide, chemin le plus court |
| Conflit [Vol] + retraite sans bord accessible | Hors scope v1 : un bord est toujours géométriquement atteignable |
| Déclenchement du script IA | Timing en temps absolu depuis le début de la bataille |
| Nombre de batailles scriptées | Une seule par faction adverse possible (2 scripts au total, symétriques) |
| Choix de faction | Réintégré en v1 (contrairement à la décision initiale) : le joueur choisit entre Wyrms et Morts-Vivants, l'IA joue l'autre — pour préserver la cohérence narrative. Écran séparé, une seule fois au début, choix persistant (localStorage) |
| Points de présence | Plafond vivant de 150 points, se libère à la mort/fuite d'une unité |
| Quantité de copies par unité | Nombre fixe par bataille (voir `units.md`) ; une copie tuée est perdue définitivement, une copie en fuite reste réutilisable |
| Fin de bataille | Victoire immédiate si l'adversaire n'a plus aucune unité (avec cas d'égalité possible) ; défaite automatique après 15s si le terrain est vide avec des réserves non redéployées |
| Aptitudes | Deux types définis : automatique (sans action du joueur) et à usage limité (activée par le joueur) — seul le type automatique est utilisé par le roster v1 |
| Après une défaite | Écran de défaite dédié avec bouton "réessayer" qui relance la même bataille (faction déjà choisie conservée) |
| Après la victoire | Écran de récompense (squelette pour la v1) puis écran d'accueil affichant la faction choisie |
| Stack UI | Phaser 3 pour le champ de bataille uniquement ; React + Tailwind + shadcn/ui (thème 8bitcn) pour toute l'UI autour (sidebar, boutons, écrans) — voir `technical.md` |

## Points encore ouverts concernant le scope v1

Aucun point bloquant restant à ce stade. Le détail des valeurs par unité (stats, coûts, aptitudes) est dans `units.md`, l'enchaînement des écrans dans `technical.md` section 5, et les mécaniques complètes dans `rules.md`.