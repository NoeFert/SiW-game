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
- Commandes du joueur (attaquer, aller à, fuir) avec cooldown de 5 secondes entre commandes (voir `rules.md` section 5)
- IA adverse scriptée, une seule bataille pour la v1, script symétrique selon la faction jouée par l'IA (voir `rules.md` section 7)
- Conditions de fin de bataille : victoire immédiate, ou compte à rebours de 15s si le terrain adverse est vide mais qu'il reste des réserves (voir `rules.md` section 8)

### Exclus (renvoyés au scope v2+)
- Gacha / monnaie d'invocation
- Traits (design doc section 6) et ses deux générateurs
- Personnalisation (noms, amélioration de stats, achat de keywords)
- Système de coût à 3 niveaux (design doc section 9) — en v1, coût fixe simple par unité
- Classes/synergies (design doc section 10.1) et arbre de renforcement (design doc section 10.2)
- Aptitudes à usage limité activées par le joueur (design doc section 4.4 / `rules.md` 6.2) — définies dans les règles, mais aucune unité du roster v1 n'en possède
- Persistance entre batailles (une session = une bataille, pas de progression sauvegardée)
- Roster étendu au-delà des 3 unités par faction, et factions supplémentaires au-delà des deux premières

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
- Persistance / sauvegarde de la progression entre batailles
- Roster étendu (plus d'unités par faction) et factions supplémentaires

---

## Décisions tranchées pour le scope v1

| Point | Décision |
|---|---|
| Découpage du temps de bataille | Temps continu (delta-time) ; chaque unité agit selon son propre timer de vitesse d'attaque |
| Dégâts simultanés (même frame) | Toutes les attaques du frame sont calculées puis appliquées ensemble — pas d'ordre d'initiative |
| Limitation des commandes | Cooldown de 5 secondes entre deux commandes (pas de quota) |
| Retraite d'une unité engagée | Toujours possible immédiatement ; l'ennemi engagé peut placer une dernière attaque au désengagement |
| Adjacence d'une unité 4-cases | Adjacente dès qu'une de ses 4 cases touche une case adjacente à la cible |
| Pathfinding d'une unité 4-cases | Bloc 2×2 rigide |
| Conflit [Vol] + retraite sans bord accessible | Hors scope v1 : un bord est toujours géométriquement atteignable |
| Déclenchement du script IA | Timing en temps absolu depuis le début de la bataille |
| Nombre de batailles scriptées | Une seule par faction adverse possible (2 scripts au total, symétriques) |
| Choix de faction | Réintégré en v1 (contrairement à la décision initiale) : le joueur choisit entre Wyrms et Morts-Vivants, l'IA joue l'autre — pour préserver la cohérence narrative |
| Points de présence | Plafond vivant de 150 points, se libère à la mort/fuite d'une unité |
| Quantité de copies par unité | Nombre fixe par bataille (voir `units.md`) ; une copie tuée est perdue définitivement, une copie en fuite reste réutilisable |
| Fin de bataille | Victoire immédiate si l'adversaire n'a plus aucune unité ; défaite automatique après 15s si le terrain est vide avec des réserves non redéployées |
| Aptitudes | Deux types définis : automatique (sans action du joueur) et à usage limité (activée par le joueur) — seul le type automatique est utilisé par le roster v1 |

## Points encore ouverts concernant le scope v1

Aucun point bloquant restant à ce stade. Le détail des valeurs par unité (stats, coûts, aptitudes) est dans `units.md`, et les mécaniques complètes dans `rules.md`.
