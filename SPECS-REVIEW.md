# SPECS-REVIEW.md

Audit de cohérence et de complétude de `SPECS/` (skill `/spec-reviewer`), le 2026-09-28.

Fichiers relus ensemble : `CONCEPT.md`, `rules.md`, `units.md`, `roadmap.md`, `technical.md`, `GRAPHICS.md`, `AGENTIC-WORKFLOW.md`, `ui-battle-screen-decisions.md`.

---

## Trous dans les règles

| # | Trou constaté | Décision | Fichier mis à jour |
|---|---|---|---|
| 1 | Comportement pendant et après les commandes **Aller** et **Attaquer** non décrit | Aller : ne combat pas pendant le trajet, redevient autonome à l'arrivée. Attaquer : l'emporte sur l'engagement ; une unité à distance avance jusqu'à la portée ; fin à la mort ou à la fuite de la cible. **La dernière commande donnée remplace toujours la précédente** | `rules.md` §5 |
| 2 | Ligne de vue des tirs citée au §7.3 mais absente du §4.5 | Dans cette version, pas de ligne de vue : obstacles et unités ne bloquent pas les tirs (possible en version future) | `rules.md` §4.5 |
| 3 | Moment où un tir inflige ses dégâts (projectiles mentionnés dans `GRAPHICS.md`) | Dégâts à l'instant du tir, résolution simultanée ; le projectile est purement visuel | `rules.md` §4.5 |
| 4 | Distance mesurée depuis quelle case d'une unité 2×2 | Entre les cases les plus proches des deux unités (portée, ennemi le plus proche, arrêt à 2 cases d'Athos) | `rules.md` §3 |
| 5 | Départage de deux ennemis à la même distance | Le moins de PV actuels, puis le premier déployé | `rules.md` §3 |
| 6 | Dernière attaque au désengagement d'une fuite : rythme et compteurs d'aptitude | Coup gratuit, hors rythme, **ne compte pas** pour les aptitudes | `rules.md` §5 et §6.1 |
| 7 | Diagonale entre deux cases bloquées (règle seulement au §7.3, pour les rochers) | Une unité au sol ne coupe jamais le coin d'un obstacle (une seule case obstacle suffit à interdire la diagonale) ; les unités ne bloquent jamais la diagonale ; [Vol] non concernées | `rules.md` §3 et §7.3 |
| 8 | Deux comptes à rebours de 15 s qui expirent au même instant | Défaite du joueur | `rules.md` §8.2 |
| 9 | Unité en fuite sans aucun bord atteignable (encerclée par des unités) | Reste en fuite sur place et riposte au corps-à-corps (pas une unité purement à distance) ; reprend la fuite dès qu'un chemin se libère | `rules.md` §5, `roadmap.md` |

## Incohérences entre fichiers

| # | Incohérence | Décision | Fichier mis à jour |
|---|---|---|---|
| 10 | `ui-battle-screen-decisions.md` gardait des points « à valider », « non tranché » et une liste d'incohérences déjà corrigées (dont un renvoi vers un `technical.md` 6.2 disparu) | Fichier mis à jour : décisions marquées ✅ avec renvoi vers `rules.md`, §5 vidé, §6 réduit à ce qui reste à décrire (rendu uniquement) | `ui-battle-screen-decisions.md` |
| 11 | `units.md` titrait « Faction jouable » / « Faction adverse » alors que les deux factions sont jouables | Titres « Faction : Wyrms » et « Faction : Morts-Vivants », une seule ligne de budget commune | `units.md` |
| 12a | `technical.md` §2.3 : « 6 écrans », sans `IntroScreen.jsx`, contre « sept écrans » au §5 | « 7 écrans », `IntroScreen.jsx` ajouté | `technical.md` |
| 12b | `GRAPHICS.md` : « fond clair » contre « champ de bataille sombre » | « fond neutre et peu contrasté » | `GRAPHICS.md` |
| 12c | `rules.md` §7.1 : l'IA libère des points par « fuite », alors qu'elle ne fuit jamais | « mort d'une unité IA ; l'IA ne fait jamais fuir ses unités » | `rules.md` |

---

## Écarts entre le code et les specs mises à jour

Les specs font désormais foi. Ces points sont à corriger dans le code, **avec un test Jest** dans `tests/logic/` pour chacun :

- **Point 4** : `chooseTarget` (`src/logic/combat.js`) et `findNearestEnemy` (`src/logic/pathfinding.js`) mesurent la distance depuis la case haut-gauche d'un 2×2 ; ils doivent utiliser les cases les plus proches, comme `isInRange` le fait déjà.
- **Point 5** : le départage à distance égale se fait aujourd'hui par ordre de la liste ; il faut trier d'abord par PV actuels.
- **Point 6** : la dernière attaque au désengagement incrémente `attacksLanded` ; elle ne doit plus compter pour les aptitudes.
- **Point 7** : le pathfinding autorise toutes les diagonales ; il doit interdire celles qui coupent le coin d'un obstacle (unités au sol uniquement). Ensuite, relancer `tests/logic/clickbaitZones.test.js` pour vérifier que les zones gardent leurs propriétés (aucune case libre isolée, passage d'une Légendaire 2×2).
- **Point 8** : vérifier la résolution de l'expiration simultanée des deux comptes à rebours (défaite du joueur).
- **Point 9** : une unité en fuite bloquée reste aujourd'hui sur place sans combattre ; elle doit riposter au corps-à-corps.
- **Point 1** : comportement du code déjà conforme ; seuls des tests explicites sont à ajouter si absents.

---

## Conclusion

Tous les points relevés ont été tranchés et reportés dans `SPECS/`. **Un agent IA qui recevrait ces fichiers sans autre contexte n'aurait pas besoin d'inventer de règle** pour les mécaniques du scope v1 et de la version clickbait.

Restent ouverts, sans effet sur les règles :
- Rendu visuel d'une unité en fuite et d'une unité engagée, emplacement et forme du compte à rebours de 15 s (`ui-battle-screen-decisions.md` §6).
- Valeurs explicitement **provisoires** (scripts IA des §7.1 et §7.3, zone « Le fort », équilibrage de `units.md`) : chiffrées et utilisables telles quelles, à ajuster en playtesting.
- Écarts code ↔ specs listés ci-dessus, à corriger dans une session de développement.
