# ROADMAP-MVP.md — Couche méta du MVP

Roadmap des fonctionnalités méta ajoutées au MVP : accueil, gestion de civilisation, invocation, monnaie. La bataille 01 et le tutoriel restent décrits dans `roadmap.md` et sont mis de côté pour l'instant.

**Ce fichier fait priorité sur `roadmap.md` en cas de contradiction** (voir notamment « Ce que ce fichier remplace dans roadmap.md » en fin de document).

---

## Objectif

Brancher sur le moteur de bataille une première boucle méta : perdre des unités en bataille, gagner des Spirit Stones, reconstituer son armée — et faire progresser le joueur et ses unités survivantes en niveau, pour que perdre peu d'unités soit récompensé.

---

## Inclus dans le MVP

### Écran d'accueil (point central du jeu après la bataille 01)
- Solde de **Spirit Stones** affiché en haut à droite (nom provisoire, libellé dans `strings.js`)
- **Niveau du joueur** et barre d'XP, près du solde (`rules.md` 11.5)
- **Spirit Fountain** (`rules.md` 11.8) : produit 1 Spirit Stone par minute en temps réel, jusqu'à une capacité de 20 + 10 × niveau du joueur ; un clic récolte. Garantit qu'on peut toujours réinvoquer après avoir tout perdu
- Trois boutons : **Partir en guerre**, **Gestion de civilisation**, **Invocation**
- **Partir en guerre** : ouvre l'écran « Partir en guerre » (voir ci-dessous)

### Partir en guerre (`rules.md` 11.7)
- **Trois batailles en séquence** (« La passe », « Les crevasses », « La citadelle », noms provisoires) : chacune se débloque en gagnant la précédente ; une bataille gagnée reste **rejouable**, avec une récompense réduite
- **Écran « Partir en guerre »** : l'armée qui partira (nom, X / 500 PP), une ligne par bataille (zones, état verrouillée / disponible / gagnée, récompense), bouton « Combattre » (désactivé si l'armée est vide)
- **Deux zones par bataille** (provisoire) : champ → « Le mur » ; « Le mur » → « Les trois couloirs » ; « Les trois couloirs » → « Le fort ». Scripts de l'IA provisoires : ceux de la bataille-clickbait. Zones et scripts définitifs : plus tard
- **Victoire** dès la fin du script de la dernière zone (comme la bataille-clickbait) ; commandes complètes et abandon possibles, pas de tutoriel
- **Défaite, abandon ou match nul** : les individus tués sont **perdus quand même** ; aucune XP ni récompense ; écran de défaite avec les pertes, « Réessayer » et « Retour à l'accueil »
- **Fin du contenu** : les trois batailles gagnées, un message annonce la suite ; tout reste rejouable

### Unités possédées : individus avec niveau, regroupés par espèce
- Le joueur possède une **liste d'individus** `{ id, species, xp }` (pas de nom, pas de PV propres, pas de trait) ; le niveau se déduit de l'XP ; les stats sont celles de l'espèce (`units.md`), augmentées selon le niveau (`rules.md` 11.6)
- L'interface regroupe les individus **par espèce** (accordéons), puis les montre un par un : ils sont discernables par leur niveau
- Un individu tué en bataille est retiré de la liste (mort définitive) et de toutes les armées qui le contiennent
- Les « copies disponibles » de `units.md` deviennent la **dotation de départ** du joueur (niveau 1), plus un maximum de possession

### Niveaux (joueur et individus)
- **Joueur** (`rules.md` 11.5) : XP à chaque victoire (100 + bonus selon les PP survivants de l'armée ; 100 fixes pour la bataille 01), courbe 500 × niveau, sans maximum. Chaque niveau rapporte des Spirit Stones (50 × nouveau niveau, provisoire)
- **Individus** (`rules.md` 11.6) : XP à la victoire seulement, bataille 01 comprise (+10 par survivant déployé, + coût en PP de chaque ennemi achevé), courbe 50 × niveau, niveau 5 maximum. +10 % de PV et de dégâts par niveau ; coût en PP inchangé
- **Écran de victoire** (jeu normal seulement, rien ne change dans la version clickbait) : XP gagnée par le joueur et individus qui ont monté de niveau
- **Bataille** : la tour de déploiement affiche une ligne par espèce **et par niveau** (`ui-battle-screen-decisions.md` 2.2)

### Gestion de civilisation — section Unités
- Liste : **un accordéon par espèce** du roster de la faction du joueur. En-tête : sprite, nom, keywords, coût en PP, nombre d'individus possédés. Une espèce à 0 (ex : Légendaire mort) reste affichée, grisée, avec son bouton « Invoquer » / « Réinvoquer » menant à l'écran Invocation
- Accordéon ouvert : **un individu par ligne** (niveau, barre d'XP, présent dans l'armée ou non)
- Clic sur un individu → **page de détail de l'individu** : grand sprite, nom de l'espèce, keywords, niveau et barre d'XP, présence dans l'armée, toutes les stats **à son niveau** (PV, dégâts, type d'attaque, taille, vitesses, portée, coût), texte des aptitudes, bouton « Invoquer » / « Réinvoquer » de son espèce menant à l'écran Invocation

### Gestion de civilisation — section Armée
- **Une seule armée** dans le MVP (les emplacements supplémentaires sont verrouillés, voir Suite)
- Une armée est une liste d'identifiants d'individus (preset) : un même individu pourra figurer dans plusieurs armées quand d'autres emplacements seront débloqués
- **Plafond : 500 PP** de coût total par armée (volontairement au-dessus des 150 PP du terrain) ; **minimum : 1 unité**
- Actions : **renommer** l'armée (1 à 20 caractères), **ajouter / retirer** des individus, avec un compteur « X / 500 PP ». Pas de suppression (armée unique)
- **Un accordéon par espèce** : fermé, un résumé seul (« 7 / 9 dans l'armée ») ; ouvert, un individu par ligne (niveau, barre d'XP) avec une case « dans l'armée » à cocher / décocher
- Un individu invoqué n'est **pas** ajouté automatiquement à l'armée
- **Armée de départ** : créée automatiquement à l'arrivée sur l'accueil après la victoire de la bataille 01, avec **tous les survivants** (les dotations de départ totalisent au plus 430 PP, donc tiennent toujours sous 500), et un nom par défaut

### Monnaie : Spirit Stones
- Somme de départ donnée au joueur au choix de la faction (0, provisoire)
- Récompense à chaque victoire : bataille 01 : 50 ; « Partir en guerre » : 60 / 80 / 100 à la première victoire, 25 % au rejeu (provisoire)

### Écran Invocation (nouveau)
- Achat d'un individu d'une **espèce déjà connue** (roster de la faction du joueur) — pas de gacha
- **Pas de plafond de possession** pour les unités non légendaires : ce qui freine le joueur, c'est la monnaie ; le plafond d'armée (500 PP) et celui du terrain (150 PP) bornent déjà ce qui combat
- **[Légendaire] unique** : au plus un exemplaire possédé. Grisé tant qu'il est vivant (« Déjà à vos côtés »), disponible seulement s'il est mort
- Rachat et réinvocation sont **la même action** (payer, ajouter un individu) ; seul le libellé change : « Invoquer » pour une unité classique, « Réinvoquer » pour un Légendaire mort. Pas de délai ni de coût croissant d'une réinvocation à l'autre
- **Niveau gardé** : à la réinvocation, le joueur choisit le niveau du Légendaire, entre 1 et celui qu'il avait à sa mort ; +25 % du prix de base par niveau gardé au-delà du 1 (`rules.md` 11.4). Un individu invoqué autrement est niveau 1
- **Prix = coût en PP de l'espèce × k**, avec un multiplicateur à part éventuel pour le [Légendaire] (valeurs à définir)

### Persistance (localStorage)
- Sont conservés : la faction choisie, la victoire de la bataille 01, la **liste des individus possédés** (avec leur XP), l'**armée** (nom + identifiants), le **solde de Spirit Stones**, l'**XP du joueur**, le **niveau du Légendaire à sa mort** (pour la réinvocation), la **liste des batailles de « Partir en guerre » gagnées** et l'**heure de la dernière récolte de la Spirit Fountain**. La liste d'individus remplace l'ancien décompte de copies par espèce
- Pas de système de sauvegarde généralisé : ni historique de batailles, ni état d'une bataille en cours

### Outil de développement
- Profil de test `test-wyrm` (menu devs) : **10 000 Spirit Stones** en plus de ses pertes figées, et des niveaux variés (joueur et individus) ; profil `test-wyrm-fallen` : même chose avec Fafnir mort au niveau 5 (détail : `technical.md` 5.7)

---

## Ordre de développement

1. Modèle de données et sauvegarde : individus `{ id, species }`, armée, solde de Spirit Stones (logique pure + tests Jest), et profil `test-wyrm` à jour
2. Écran d'accueil : solde en haut à droite, trois boutons (« Partir en guerre » sans contenu pour l'instant)
3. Gestion de civilisation, section Unités : liste par espèce + page de détail
4. Gestion de civilisation, section Armée : armée de départ automatique, renommage, composition sous 500 PP
5. Écran Invocation : achat, réinvocation du Légendaire, débit des Spirit Stones
6. Logique des niveaux (logique pure + tests Jest) : courbes d'XP du joueur et des individus, stats par niveau, XP gagnée à la victoire, prix de réinvocation selon le niveau gardé
7. Sauvegarde des niveaux (XP des individus, XP du joueur, niveau du Légendaire à sa mort), profil `test-wyrm` à jour, niveau et barre d'XP sur l'accueil
8. Gestion de civilisation, section Unités : accordéons par espèce + page de détail d'un individu
9. Gestion de civilisation, section Armée : accordéons par espèce, case « dans l'armée » par individu
10. Bataille : déploiement d'individus précis avec leurs stats de niveau, tour par espèce et niveau, coups fatals attribués ; à la victoire, XP des individus et du joueur (affichée sur l'écran de victoire), récompenses de niveau
11. Écran Invocation : réinvocation du Légendaire avec choix du niveau gardé
12. Second passage de roadmap : contenu de « Partir en guerre » **(fait : `rules.md` 11.7)** ; valeurs chiffrées de l'économie à revoir après playtest
13. « Partir en guerre » — données et logique (logique pure + tests Jest) : définition des trois batailles (zones et scripts provisoires), déblocage en séquence, récompenses (pleine / réduite), pertes en défaite, filet de sécurité (remplacé ensuite par la Spirit Fountain, étape 15) ; sauvegarde des batailles gagnées
14. « Partir en guerre » — écrans : `WarScreen`, bataille avec l'armée, écran de défaite enrichi (pertes, « Retour à l'accueil »), bouton de l'accueil activé
15. Spirit Fountain : logique (tests Jest), sauvegarde de l'heure de dernière récolte, affichage et récolte sur l'accueil
16. Playtest et chiffrage de l'économie (somme de départ, k, récompenses, récompense de niveau)

---

## Exclus du MVP (renvoyés en suite)

- Gacha (invocation d'espèces inconnues ou aléatoires)
- Plus d'une armée : les emplacements supplémentaires restent verrouillés
- Personnalisation des individus (noms, stats choisies, keywords) — seuls le renommage d'une armée et la progression en niveau sont inclus
- Délai ou coût croissant de réinvocation
- Suppression d'une armée

## Suite

- Déblocage progressif d'emplacements d'armée supplémentaires, **à certains niveaux du joueur** (niveaux à définir)
- **Hausse ponctuelle du plafond de l'armée** (500 PP) à certains niveaux du joueur (niveaux et montants à définir)
- **Amélioration** permettant à un individu de dépasser le niveau 5 (forme et coût à définir)
- **Cooldown des commandes réduit** selon le niveau du joueur (`rules.md` 5.1 ; courbe à définir)
- Personnalisation des individus — le modèle `{ id, species, xp }` est prévu pour l'accueillir sans migration de sauvegarde
- Réinvocation avec délai ou coût croissant
- Gacha

---

## Décisions tranchées

| Point | Décision |
|---|---|
| Unités possédées | Liste d'individus `{ id, species, xp }` en données, regroupés par espèce puis montrés un par un ; la dotation de départ vient de `units.md` ; un individu tué est perdu définitivement |
| Pourquoi des individus dès le MVP | La sauvegarde doit de toute façon changer (monnaie, armée), et une armée référence des individus : cela évite une migration des sauvegardes quand la personnalisation arrivera. Seule l'XP est ajoutée maintenant |
| Niveau des individus | Porté par chaque individu (pas par l'espèce) ; XP à la victoire (survie + ennemis achevés) ; niveau 1 à 5 ; +10 % PV et dégâts par niveau ; coût en PP fixe, pour que garder ses unités en vie les rende plus fortes sous le même plafond |
| Niveau du joueur | XP à la victoire (100 + bonus selon les PP survivants ; 100 fixes au tutoriel) ; sans maximum ; rapporte des Spirit Stones. Emplacements d'armée et plafond de PP liés au niveau : hors MVP |
| Armée | Une seule armée (preset d'identifiants), renommable, 500 PP max, 1 unité min ; créée automatiquement avec tous les survivants de la bataille 01, nommée « Armée 1 » ; composée individu par individu (accordéons) |
| Invocation | Achat d'espèces connues sans plafond ; Légendaire unique, réinvocable seulement s'il est mort ; même action pour rachat et réinvocation ; prix = coût PP × k ; à la réinvocation, niveau gardé au choix, +25 % du prix par niveau |
| Monnaie | Spirit Stones (nom provisoire) : somme de départ + récompenses de victoire (réduites au rejeu) + récompenses de niveau ; solde affiché en haut à droite de l'accueil |
| Partir en guerre | Trois batailles en séquence, deux zones chacune, rejouables ; pertes définitives même en défaite ; la Spirit Fountain évite le blocage |

## Points encore ouverts

- **Économie** (valeurs provisoires, à chiffrer après playtest) : somme de départ (0), k (1), multiplicateur du Légendaire (×1), récompenses de victoire (50 ; 60 / 80 / 100 ; 25 % au rejeu), Spirit Fountain (1 / min, 20 + 10 × niveau)
- **Partir en guerre** : zones et scripts de l'IA définitifs des trois batailles (provisoirement ceux de la bataille-clickbait)
- **Récompense de niveau du joueur** : 50 × nouveau niveau en Spirit Stones, provisoire, à revoir avec k

---

## Ce que ce fichier remplace dans roadmap.md

- « Écran de gestion de civilisation (lecture seule) » et « Toute action sur l'écran de gestion de civilisation » (exclu) → la civilisation permet désormais de composer et renommer l'armée
- « Persistance ciblée » (trois valeurs) et « Progression sauvegardée complète » (exclu) → la sauvegarde contient aussi les individus (avec leur XP), l'armée, le solde, l'XP du joueur, le niveau du Légendaire à sa mort les batailles de « Partir en guerre » gagnées et l'heure de la dernière récolte de la Spirit Fountain
- « XP » et « amélioration d'unités » dans « Progression sauvegardée complète » (exclu), et « amélioration de stats » dans « Personnalisation » (exclu) → les niveaux du joueur et des individus sont inclus (`rules.md` 11.5 et 11.6) ; noms et achat de keywords restent exclus
- « Gacha / monnaie d'invocation » (exclu) → la monnaie et l'invocation d'espèces connues sont incluses ; seul le gacha reste exclu
- « Plusieurs niveaux/batailles enchaînés » (exclu) → « Partir en guerre » est dans le MVP : trois batailles en séquence (`rules.md` 11.7)
- Décisions « Quantité de copies par unité », « Après la victoire » et « Gestion de civilisation » → voir « Décisions tranchées » ci-dessus
