# SPECS-REVIEW.md

## Audit du 2026-09-29 (2e passage) — niveaux du joueur et des individus

Audit de cohérence et de complétude de `SPECS/` (skill `/spec-reviewer`), après l'ajout des niveaux (`/enricher` : `rules.md` 11.5 et 11.6, `roadmap-mvp.md` étapes 6 à 11) et le code des étapes 1 à 5 de `roadmap-mvp.md`.

Fichiers relus ensemble : `CONCEPT.md`, `rules.md`, `units.md`, `roadmap.md`, `roadmap-mvp.md`, `technical.md`, `GRAPHICS.md`, `POC-SPECS.md`, `AGENTIC-WORKFLOW.md`, `ui-battle-screen-decisions.md` (`POC-ASSETS.md` n'existe pas).

| # | Type | Constat | Décision | Fichier mis à jour |
|---|---|---|---|---|
| 1 | Incohérence | `rules.md` 5.1 : le cooldown « diminue avec le niveau du joueur » — ce niveau existe désormais, sans courbe | Cooldown fixe à 5 s dans le MVP ; réduction selon le niveau renvoyée en Suite | `rules.md` 5.1, `roadmap-mvp.md` (Suite) |
| 2 | Incohérence | `rules.md` §2 : en bataille, « les individus qu'il possède » ; §9 et 11.5 : l'armée « limite ce que le joueur emmène » | Bataille 01 : tous les individus possédés ; batailles de « Partir en guerre » : les individus de l'armée | `rules.md` §2 |
| 3 | Cas limite | Arrondi inférieur du +10 % : certains niveaux n'apportent aucun dégât (Ver et Squelette niveau 2) | Arrondi au plus proche (0,5 au-dessus), calcul en entiers : base × (9 + niveau) / 10 ; exemples chiffrés | `rules.md` 11.6 |
| 4 | Incohérence specs ↔ code | `technical.md` annonce `army.js` / `summon.js`, le code a un seul `civilization.js` | Un fichier par domaine : `ownedUnits.js`, `army.js`, `summon.js`, `levels.js` ; specs et code mis à jour (`civilization.js` découpé, tests aussi ; 294 tests verts avant et après) | `technical.md` 2, 2.3 |
| 5 | Incohérence | `technical.md` 5.3 : écran de victoire « titre + un bouton » contre XP affichée (5.1, 11.5) | Jeu normal : titre, « +X XP », individus qui ont monté de niveau (regroupés, « 2x Ver de Lambton niv 1 → 2 »), bouton. **Version clickbait inchangée** | `technical.md` 5.3, `rules.md` 11.6, `roadmap-mvp.md` |
| 6 | Mentions dépassées | En-tête de `rules.md` limité au « moteur de bataille » ; niveaux absents des priorités de tests | En-tête : moteur + couche méta ; 7e priorité de tests : niveaux | `rules.md` (en-tête), `technical.md` 4 |
| 7 | Trou | Profil `test-wyrm` sans valeurs de niveau ; réinvocation à niveau gardé non testable à la main | `test-wyrm` : joueur 1 700 XP, individus à niveaux variés (dont un MAX), Fafnir niveau 4 ; nouveau profil `test-wyrm-fallen` : Fafnir mort au niveau 5 | `technical.md` 5.7, `roadmap-mvp.md` |
| 8 | Trou | Espaces autour du nom d'armée (le code les retire, la règle n'en parlait pas) | Retirés avant l'enregistrement ; 20 caractères comptés après retrait | `rules.md` 11.2 |
| 9 | Trou | `rules.md` 11.1 : morts retirés seulement « à la victoire de la bataille 01 », alors que XP et mémoire du [Légendaire] valent à chaque victoire | Morts retirés à chaque victoire ; défaites de « Partir en guerre » : à définir | `rules.md` 11.1 |

Trous comblés pendant `/enricher`, juste avant cet audit : coup fatal simultané (chaque tueur gagne toute l'XP), niveau figé pendant une bataille, niveau mémorisé du [Légendaire] écrasé à chaque mort, tri des individus (niveau puis XP décroissants), « MAX » au niveau 5, repères visuels dans `GRAPHICS.md`.

**Écarts code ↔ specs** (à corriger en développement) :
- icône de Spirit Stones (losange violet, `GRAPHICS.md`) absente des soldes et prix de `HomeScreen` et `SummonScreen` ;
- tout le code des niveaux (étapes 6 à 11 de `roadmap-mvp.md`) reste à écrire.

**Conclusion :** un agent IA qui recevrait ces fichiers sans autre contexte **n'aurait pas besoin d'inventer de règle** pour coder les étapes 6 à 11 de `roadmap-mvp.md` (niveaux). Restent ouverts, sans bloquer ces étapes (`rules.md` section 10) :
- contenu de « Partir en guerre » (batailles, scripts, récompenses, conséquences d'une défaite) ; phases et scripts de la bataille 01 ;
- récompense en Spirit Stones de la bataille 01 ;
- valeurs **provisoires** à revoir au second passage de roadmap : somme de départ (0), k (1), multiplicateur du [Légendaire] (×1), récompense de niveau du joueur (50 × niveau).

---

## Audit du 2026-09-29 — couche méta du MVP

Audit de cohérence et de complétude de `SPECS/` (skill `/spec-reviewer`), après l'ajout de la couche méta (`roadmap-mvp.md`, `rules.md` section 11).

Fichiers relus ensemble : `CONCEPT.md`, `rules.md`, `units.md`, `roadmap.md`, `roadmap-mvp.md`, `technical.md`, `GRAPHICS.md`, `POC-SPECS.md`, `AGENTIC-WORKFLOW.md`, `ui-battle-screen-decisions.md`.

| # | Type | Constat | Décision | Fichier mis à jour |
|---|---|---|---|---|
| 1 | Trou | Génération de l'« identifiant unique » d'un individu non précisée (risque : identifiant dérivé de la taille de la liste, réutilisé après une mort) | `crypto.randomUUID()` à la création ; aucun compteur sauvegardé | `technical.md` 5.4 |
| 2 | Trou | Confirmation avant une invocation (action irréversible) non précisée | Un clic pour une unité non légendaire ; boîte de confirmation pour réinvoquer le [Légendaire] | `rules.md` 11.4 |
| 3 | Trou | Sort des sauvegardes à l'ancien format (décompte de copies) | Pas de migration : sauvegarde sans liste d'individus effacée, retour à `IntroScreen` | `technical.md` 5.4 |
| 4 | Trou | Emplacement et tests de la logique méta non prévus (`technical.md` ne parlait que du moteur de bataille) | Règles dans `src/logic/` (`army.js`, `summon.js`), `persistence.js` sans règle ; 6e priorité de tests ; 8 écrans dans l'arborescence | `technical.md` 2, 2.2, 2.3, 4 |
| 5 | Incohérence | `rules.md` 7 : « une seule bataille scriptée » contre « Partir en guerre » dans le MVP | Bataille 01 scriptée ; batailles de « Partir en guerre » scriptées aussi, à définir | `rules.md` 7 |
| 6 | Incohérence | « Budget total de 150 points » ambigu face au plafond d'armée de 500 | Renommé « plafond simultané sur le terrain », avec renvoi au plafond d'armée | `rules.md` 9, `units.md` |

**Contradictions assumées :** `roadmap.md` décrit encore l'ancien MVP (civilisation en lecture seule, trois valeurs sauvegardées, monnaie exclue). `roadmap-mvp.md` fait priorité en cas de contradiction (écrit dans `roadmap-mvp.md` et `CLAUDE.md`) et liste les passages remplacés.

**Conclusion :** un agent IA qui recevrait ces fichiers pourrait coder les étapes 1 à 3 de `roadmap-mvp.md` (données et sauvegarde, accueil, unités) sans inventer de règle, et l'étape 4 (armée) dès que le nom par défaut de l'armée est choisi. Restent ouverts, et doivent être tranchés avant de coder ce qui en dépend (`rules.md` section 10) :
- somme de départ en Spirit Stones et moment du don, récompense de la bataille 01, coefficient de prix k et multiplicateur du [Légendaire] — **bloquants pour l'étape 5 (Invocation)** ;
- nom par défaut de l'armée de départ — bloquant pour l'étape 4 ;
- contenu de « Partir en guerre » ; phases et scripts de la bataille 01.

---

## Audit du 2026-09-28 — moteur de bataille

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
