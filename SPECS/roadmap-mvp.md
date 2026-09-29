# ROADMAP-MVP.md — Couche méta du MVP

Roadmap des fonctionnalités méta ajoutées au MVP : accueil, gestion de civilisation, invocation, monnaie. La bataille 01 et le tutoriel restent décrits dans `roadmap.md` et sont mis de côté pour l'instant.

**Ce fichier fait priorité sur `roadmap.md` en cas de contradiction** (voir notamment « Ce que ce fichier remplace dans roadmap.md » en fin de document).

---

## Objectif

Brancher sur le moteur de bataille une première boucle méta : perdre des unités en bataille, gagner des Spirit Stones, reconstituer son armée.

---

## Inclus dans le MVP

### Écran d'accueil (point central du jeu après la bataille 01)
- Solde de **Spirit Stones** affiché en haut à droite (nom provisoire, libellé dans `strings.js`)
- Trois boutons : **Partir en guerre**, **Gestion de civilisation**, **Invocation**
- **Partir en guerre** : présent dans le MVP, mais son contenu (batailles après la bataille 01) sera spécifié dans un second passage de roadmap. Une armée reconstituée sera nécessaire pour avancer dans ces batailles

### Unités possédées : individus en données, affichage par espèce
- Le joueur possède une **liste d'individus** `{ id, species }` (aucun autre champ : pas de nom, pas de PV propres, pas de trait) ; les stats restent celles de l'espèce (`units.md`)
- Toute l'interface du MVP regroupe les individus **par espèce**
- Un individu tué en bataille est retiré de la liste (mort définitive) et de toutes les armées qui le contiennent
- Les « copies disponibles » de `units.md` deviennent la **dotation de départ** du joueur, plus un maximum de possession

### Gestion de civilisation — section Unités
- Liste : une ligne par espèce du roster de la faction du joueur — sprite, nom, keywords, coût en PP, nombre d'individus possédés. Une espèce à 0 (ex : Légendaire mort) reste affichée, grisée
- Clic sur une ligne → **page de détail de l'espèce** : grand sprite, nom, keywords, toutes les stats de `units.md` (PV, dégâts, type d'attaque, taille, vitesses, portée, coût), texte des aptitudes, nombre possédé et nombre présent dans l'armée, bouton « Invoquer » / « Réinvoquer » menant à l'écran Invocation

### Gestion de civilisation — section Armée
- **Une seule armée** dans le MVP (les emplacements supplémentaires sont verrouillés, voir Suite)
- Une armée est une liste d'identifiants d'individus (preset) : un même individu pourra figurer dans plusieurs armées quand d'autres emplacements seront débloqués
- **Plafond : 500 PP** de coût total par armée (volontairement au-dessus des 150 PP du terrain) ; **minimum : 1 unité**
- Actions : **renommer** l'armée (1 à 20 caractères), **ajouter / retirer** des unités par espèce, avec un compteur « X / 500 PP ». Pas de suppression (armée unique)
- Un individu invoqué n'est **pas** ajouté automatiquement à l'armée
- **Armée de départ** : créée automatiquement à l'arrivée sur l'accueil après la victoire de la bataille 01, avec **tous les survivants** (les dotations de départ totalisent au plus 430 PP, donc tiennent toujours sous 500), et un nom par défaut

### Monnaie : Spirit Stones
- Somme de départ donnée au joueur (montant et moment à définir)
- Récompense à la victoire de la bataille 01 (montant, et somme fixe ou liée aux pertes, à définir), puis des batailles de « Partir en guerre »

### Écran Invocation (nouveau)
- Achat d'un individu d'une **espèce déjà connue** (roster de la faction du joueur) — pas de gacha
- **Pas de plafond de possession** pour les unités non légendaires : ce qui freine le joueur, c'est la monnaie ; le plafond d'armée (500 PP) et celui du terrain (150 PP) bornent déjà ce qui combat
- **[Légendaire] unique** : au plus un exemplaire possédé. Grisé tant qu'il est vivant (« Déjà à vos côtés »), disponible seulement s'il est mort
- Rachat et réinvocation sont **la même action** (payer, ajouter un individu) ; seul le libellé change : « Invoquer » pour une unité classique, « Réinvoquer » pour un Légendaire mort. Pas de délai ni de coût croissant
- **Prix = coût en PP de l'espèce × k**, avec un multiplicateur à part éventuel pour le [Légendaire] (valeurs à définir)

### Persistance (localStorage)
- Sont conservés : la faction choisie, la victoire de la bataille 01, la **liste des individus possédés**, l'**armée** (nom + identifiants), le **solde de Spirit Stones**. La liste d'individus remplace l'ancien décompte de copies par espèce
- Pas de système de sauvegarde généralisé : ni historique de batailles, ni XP, ni état d'une bataille en cours

### Outil de développement
- Profil de test `test-wyrm` (menu devs) : **10 000 Spirit Stones** en plus de ses pertes figées

---

## Ordre de développement

1. Modèle de données et sauvegarde : individus `{ id, species }`, armée, solde de Spirit Stones (logique pure + tests Jest), et profil `test-wyrm` à jour
2. Écran d'accueil : solde en haut à droite, trois boutons (« Partir en guerre » sans contenu pour l'instant)
3. Gestion de civilisation, section Unités : liste par espèce + page de détail
4. Gestion de civilisation, section Armée : armée de départ automatique, renommage, composition sous 500 PP
5. Écran Invocation : achat, réinvocation du Légendaire, débit des Spirit Stones
6. Second passage de roadmap : contenu de « Partir en guerre », récompenses, valeurs chiffrées de l'économie

---

## Exclus du MVP (renvoyés en suite)

- Gacha (invocation d'espèces inconnues ou aléatoires)
- Plus d'une armée : les emplacements supplémentaires restent verrouillés
- Personnalisation des individus (noms, stats, keywords) — seul le renommage d'une armée est inclus
- Délai ou coût croissant de réinvocation
- Suppression d'une armée

## Suite

- Déblocage progressif d'emplacements d'armée supplémentaires, au fil du jeu
- Personnalisation des individus — le modèle `{ id, species }` est prévu pour l'accueillir sans migration de sauvegarde
- Réinvocation avec délai ou coût croissant
- Gacha

---

## Décisions tranchées

| Point | Décision |
|---|---|
| Unités possédées | Liste d'individus `{ id, species }` en données, affichage regroupé par espèce ; la dotation de départ vient de `units.md` ; un individu tué est perdu définitivement |
| Pourquoi des individus dès le MVP | La sauvegarde doit de toute façon changer (monnaie, armée), et une armée référence des individus : cela évite une migration des sauvegardes quand la personnalisation arrivera. Aucun champ de personnalisation n'est ajouté maintenant |
| Armée | Une seule armée (preset d'identifiants), renommable, 500 PP max, 1 unité min ; créée automatiquement avec tous les survivants de la bataille 01, nommée « Armée 1 » |
| Invocation | Achat d'espèces connues sans plafond ; Légendaire unique, réinvocable seulement s'il est mort ; même action pour rachat et réinvocation ; prix = coût PP × k |
| Monnaie | Spirit Stones (nom provisoire) : somme de départ + récompenses de victoire ; solde affiché en haut à droite de l'accueil |
| Partir en guerre | Dans le MVP, développé après la gestion et l'invocation ; contenu à spécifier |

## Points encore ouverts

- **Économie** : somme de départ en Spirit Stones (montant ; 0 provisoire, donné au choix de la faction), récompense de la bataille 01 (montant, fixe ou liée aux pertes), coefficient de prix k et multiplicateur éventuel du Légendaire (provisoirement k = 1, sans multiplicateur)
- **Partir en guerre** : nombre de batailles, terrains, scripts IA, récompenses, déblocage, et ce qui se passe à la défaite (pertes persistées ou non)

---

## Ce que ce fichier remplace dans roadmap.md

- « Écran de gestion de civilisation (lecture seule) » et « Toute action sur l'écran de gestion de civilisation » (exclu) → la civilisation permet désormais de composer et renommer l'armée
- « Persistance ciblée » (trois valeurs) et « Progression sauvegardée complète » (exclu) → la sauvegarde contient aussi les individus, l'armée et le solde
- « Gacha / monnaie d'invocation » (exclu) → la monnaie et l'invocation d'espèces connues sont incluses ; seul le gacha reste exclu
- « Plusieurs niveaux/batailles enchaînés » (exclu) → « Partir en guerre » est dans le MVP, contenu à spécifier
- Décisions « Quantité de copies par unité », « Après la victoire » et « Gestion de civilisation » → voir « Décisions tranchées » ci-dessus
