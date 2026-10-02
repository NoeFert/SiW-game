# SPECS-REVIEW.md — Revue de cohérence et de complétude

Date : 2026-10-02. Fichiers relus ensemble : `CONCEPT.md`, `rules.md`, `units.md`, `roadmap.md`, `roadmap-mvp.md`, `technical.md`, `POC-SPECS.md`, `GRAPHICS.md`, `AGENTIC-WORKFLOW.md`, `ui-battle-screen-decisions.md`.

Vérifications chiffrées sans écart : dotations de départ (430 / 418 PP), coûts des scripts IA (175 / 159), copies de l'IA suffisantes pour tous les scripts de phase, profils `test-wyrm` (375 / 265 PP, seuils d'XP), courbes de niveau et exemples de 11.4 / 11.6.

## Trous et incohérences traités

| # | Constat | Type | Décision | Fichiers modifiés |
|---|---|---|---|---|
| 1 | Une unité au sol vise « l'ennemi le plus proche » à vol d'oiseau, même s'il est inatteignable (couloir voisin dans « Les trois couloirs », unité [Vol] au-dessus d'un mur). Le code peut rester bloqué contre une crête. | Trou | Seuls comptent d'abord les ennemis atteignables en contournant les obstacles du terrain (les unités ne rendent jamais un ennemi inatteignable). S'il ne reste que des ennemis inatteignables, l'unité se dirige quand même vers le plus proche, pour être sur place dès qu'il devient atteignable. [Vol] non concernées. | `rules.md` 3 |
| 2 | Bataille 01 : « plusieurs phases, à définir » (`roadmap.md`, `rules.md` 7.3) contre « n'a qu'une phase », et « aucun point bloquant ». | Incohérence + trou | La bataille 01 garde **une seule phase** dans le MVP. | `roadmap.md`, `rules.md` 7.3, `POC-SPECS.md` |
| 3 | Écran de victoire : les montants sont fixés dans `rules.md`, mais `technical.md` les disait « à définir », et rien ne disait comment les afficher. | Incohérence + trou | Victoire du jeu normal : XP du joueur, individus qui ont monté de niveau, bloc « +X » de Spirit Stones (récompense de victoire + récompenses de niveau), puis la liste des unités perdues au format du bilan du clickbait. | `technical.md` 5.1 et 5.3, `roadmap-mvp.md` |
| 4 | Recharger la page pendant une bataille de « Partir en guerre » annule les pertes. | Trou (cas limite) | Faille acceptée pour le MVP : la bataille est annulée (ni pertes, ni XP, ni récompense). Aucune nouvelle persistance. | `rules.md` 11.7 |
| 5 | Le sort du compte à rebours de 15 s pendant une transition de phase n'était pas défini. | Trou (cas limite) | **Compte à rebours supprimé partout, pour les deux camps.** Victoire : script de l'IA terminé (dernière phase) et terrain de l'IA vide, dans toutes les batailles. Défaite : plus aucune unité (terrain + réserve) ou abandon. Match nul : les deux au même instant. | `rules.md` 5.2, 7.3, 8 (réécrite), 11.7 ; `POC-SPECS.md` ; `roadmap.md` ; `technical.md` ; `ui-battle-screen-decisions.md` |
| 6 | « L'armée contient au moins 1 individu » alors que les morts peuvent la vider. | Incohérence | Le minimum interdit seulement de retirer soi-même le dernier individu ; une armée vidée par les morts désactive « Combattre », sans ajout automatique. Renvoi corrigé (« section 2 » devient 11.2). | `rules.md` 11.2 et 11.7 |
| 7 | `GRAPHICS.md` : la Spirit Fountain est sans barre dans une section, avec une barre dorée dans une autre. | Incohérence | Pas de barre : contenu seul. | `GRAPHICS.md` |
| 8 | Mentions périmées : « Les trois couloirs » renvoyée à la Suite, section 10 « vide », SummonScreen accessible « depuis le détail d'une espèce », « plus un maximum » (ambigu), « une seule bataille pour la v1 », « aucun point ouvert ». | Incohérences mineures | Toutes corrigées. | `POC-SPECS.md`, `technical.md`, `roadmap-mvp.md`, `roadmap.md` |

## Ce qui reste ouvert (déjà signalé comme provisoire dans les specs)

Ces valeurs sont écrites et chiffrées, donc un agent peut les implémenter sans rien inventer. Elles restent marquées comme provisoires :
- économie : somme de départ (0), k (1), multiplicateur du Légendaire (×1), récompenses de victoire, Spirit Fountain, récompense de niveau (`rules.md` 10) ;
- zones et scripts de l'IA définitifs de « Partir en guerre » (provisoirement ceux de la bataille-clickbait, `rules.md` 11.7) ;
- emplacements 4 à 10 de la map 1 : verrouillés, sans contenu (rien à implémenter).

## Écarts code / specs créés par cette revue

Ces décisions modifient des règles déjà codées. Il faudra les reporter dans le code, chacune dans une étape à part avec ses tests Jest :
- suppression du compte à rebours de 15 s, et nouvelle condition de victoire de la bataille 01 (`rules.md` 8) ;
- ciblage des ennemis inatteignables (`rules.md` 3, `src/logic/combat.js`) ;
- contenu de l'écran de victoire du jeu normal (`technical.md` 5.3).

## Conclusion

Un agent IA qui recevrait ces fichiers sans autre contexte n'aurait pas besoin d'inventer de règle pour le scope v1. Les seuls points encore ouverts sont des valeurs provisoires, mais elles sont chiffrées.
