# RULES.md — Scope v1

Règles du jeu en détail, chiffrées. Chaque ligne doit être vérifiable en jouant une bataille.

Ce fichier couvre uniquement le **scope v1** (moteur de bataille). Voir `roadmap.md` pour ce qui est repoussé en v2+.

---

## 1. Terrain

- Le terrain de bataille est une grille rectangulaire de **24 cases de large × 14 cases de haut**.
- Deux unités ne peuvent jamais occuper la même case.
- Certaines cases peuvent être des obstacles infranchissables. Pour la bataille v1 : **16 obstacles : 12 d'une case et 4 blocs de 2×2 cases**, dispersés sur le terrain plutôt que concentrés, en évitant de former des couloirs fermés ou des culs-de-sac, répartis symétriquement de part et d'autre de la ligne médiane pour que le terrain reste équitable quel que soit le camp (positions exactes : `src/data/battlefield.js`).

## 2. Déploiement

- Le camp du joueur est la **moitié gauche** du terrain, collée à la tour de commandement ; l'IA occupe la moitié droite. Le joueur attaque donc de gauche à droite.
- Le joueur peut déployer ses unités sur **toute sa moitié du terrain** (12 colonnes de large sur les 24), pas seulement sur une ligne de départ.
- Déployer une unité **arrête le temps** : la bataille se met en pause (pause d'interaction, section 5.2) dès le début du glisser-déposer, pendant que le joueur choisit et positionne son unité.
- Le déploiement est limité par les **points de présence** disponibles : le joueur dispose d'un plafond de **150 points de présence pouvant être déployés simultanément** (voir section 9 et `units.md` pour le détail du coût de chaque unité).
- Ce plafond est **vivant, pas un budget dépensé une seule fois** : le coût en points de présence d'une unité se libère dès qu'elle meurt ou fuit le terrain (commande de retraite, section 5), permettant au joueur de redéployer d'autres unités en cours de bataille tant que le total des unités actuellement sur le terrain reste sous le plafond.
- **Limite de quantité par unité [Légendaire] :** un seul exemplaire de l'unité [Légendaire] d'une faction (Fafnir ou Athos selon le camp) peut être déployé simultanément sur le terrain, indépendamment du budget de points disponible.
- **Copies disponibles pour la bataille :** chaque unité (légendaire ou non) dispose d'un nombre fixe de copies pour une même bataille. Pour le joueur du jeu normal, ce sont les individus qu'il possède (section 11.1) ; pour l'IA et pour la version clickbait, les copies de `units.md`.
  - Une unité **tuée** en combat consomme définitivement une copie (perdue pour le reste de la bataille, cohérent avec la mort définitive, section 4.4). C'est aussi le cas d'une unité tuée à l'instant même où elle atteint le bord en fuyant : elle est morte, pas en fuite.
  - Une unité qui **fuit** (retraite, section 5) retourne en réserve avec ses points de vie réduits conservés, et **reste disponible** pour un redéploiement ultérieur dans la même bataille — sa copie n'est pas perdue.
- L'IA se déploie sur l'autre moitié du terrain (moitié droite, 12 colonnes), selon un script prédéfini (voir section 7).

## 3. Mouvement

- Le déplacement est possible en 8 directions (y compris diagonale).
- **Diagonale et obstacles :** une unité ne coupe jamais le coin d'un obstacle — un pas en diagonale est interdit dès qu'**une des deux cases** du coin traversé est un obstacle (l'unité doit d'abord faire un pas droit pour le contourner). Les **unités**, elles, ne bloquent jamais la diagonale : on peut passer en diagonale entre deux unités qui ne se touchent que par un coin. Les unités [Vol] ne sont pas concernées (elles ignorent les obstacles, voir plus bas).
- **Distances :** toutes les distances du jeu (portée de tir, ennemi le plus proche, longueur d'un trajet) se comptent en cases, et une case en diagonale vaut une case, comme une case droite. Pour une unité occupant 4 cases (2×2), la distance se mesure entre les **cases les plus proches** des deux unités — que ce soit pour la portée de tir, l'ennemi le plus proche ou l'arrêt à 2 cases d'Athos (section 4.5).
- **Sans ennemi sur le terrain**, une unité sans commande reste sur place jusqu'à l'arrivée d'un ennemi.
- Une unité se déplace vers l'ennemi le plus proche par défaut, en contournant les obstacles et les autres unités qui bloquent le passage.
- **Égalité de distance :** si plusieurs ennemis sont à la même distance, l'unité choisit celui qui a **le moins de PV actuels**. En cas de nouvelle égalité, le premier déployé.
- Chaque unité a sa propre vitesse de déplacement (voir `units.md` pour les valeurs du roster).
- **Unités occupant 4 cases (2×2) :** se déplacent comme un bloc rigide — un déplacement n'est valide que si les 4 cases de destination sont toutes libres. Si le passage est trop étroit (couloir d'une seule case de large), l'unité attend ou contourne, exactement comme une unité normale face à un obstacle.
- **Unités [Vol] :** ignorent les obstacles terrestres dans leur pathfinding — un obstacle qui bloquerait une unité au sol n'a aucun effet sur leur trajectoire. Cette règle ne s'applique qu'aux obstacles de terrain : les autres unités continuent de bloquer le passage normalement (deux unités ne peuvent jamais occuper la même case, voir section 1). Une unité [Vol] peut s'arrêter au-dessus d'un obstacle. Le déploiement, lui, se fait toujours sur une case libre, même pour une unité [Vol] (section 2).

## 4. Combat

### 4.1 Déroulement dans le temps
- Le temps de bataille s'écoule en continu (pas de tour par tour). Chaque unité attaque selon son propre rythme, déterminé par sa vitesse d'attaque (voir `units.md` pour les valeurs du roster). Ce rythme repart de zéro chaque fois qu'une unité arrive au contact ou à portée de tir : elle porte son premier coup après un intervalle complet, jamais instantanément. Une unité qui attaque déjà garde son rythme quand elle change de cible (sa cible est morte, et un autre ennemi est déjà au contact ou à portée). C'est aussi le cas d'une unité hybride qui passe du tir au corps-à-corps. Le rythme ne repart de zéro que pour une unité qui n'attaquait pas.
- Quand plusieurs unités infligent des dégâts au même instant, **toutes les attaques de cet instant sont d'abord calculées, puis appliquées ensemble** — aucune unité n'a d'avantage d'ordre sur une autre. Concrètement : si deux unités s'entretuent au même instant, elles meurent toutes les deux.
- **Coup fatal simultané :** si plusieurs attaques du même instant tuent une cible, chacun de ces attaquants compte comme ayant porté le coup fatal (utile pour les aptitudes déclenchées au coup fatal, ex : Soif de sang d'Athos) — sauf un attaquant qui meurt lui-même à cet instant : une unité morte ne bénéficie d'aucun effet.
- **Effets posés à un instant donné :** un effet qui vise « la prochaine attaque » d'une cible (ex : Frappe paralysante d'Athos) ne touche jamais une attaque de cette même cible portée au même instant — seulement la suivante.

### 4.2 Engagement au corps-à-corps
- Si deux unités alliées veulent attaquer la même cible au corps-à-corps, la seconde arrivée contourne la première pour trouver une case libre également adjacente à la cible.
- S'il n'y a plus de case adjacente libre sur cette cible, l'unité **se redirige vers le prochain ennemi le plus proche** plutôt que d'attendre. Elle n'attend qu'une place se libère que s'il ne reste **aucun autre ennemi** disponible à attaquer (le premier ennemi occupé est alors la seule option restante).
- Une unité **engagée** (en train d'échanger des attaques au corps-à-corps) ne peut pas changer de cible tant que l'ennemi n'est pas mort.
- Une unité alliée en attente d'une place libre peut, elle, se rediriger vers un autre ennemi qui se rapproche.

### 4.3 Adjacence des unités 4 cases (2×2)
- Une unité occupant 4 cases est considérée **adjacente à une cible** dès qu'**une seule** de ses 4 cases touche une case adjacente à la cible (pas besoin que le bloc entier soit collé).

### 4.4 Mort
- Quand les points de vie d'une unité atteignent 0, elle meurt et est retirée du terrain.
- Une unité morte en bataille est perdue définitivement : l'individu ne revient jamais. Le joueur peut racheter un nouvel individu de la même espèce, ou réinvoquer son [Légendaire] (section 11.4).

### 4.5 Attaque à distance
- Une unité à distance a une **portée de tir**, une valeur fixe propre à l'unité (voir `units.md` pour les valeurs du roster).
- **Dégâts immédiats** : les dégâts d'un tir sont appliqués à l'instant du tir, comme une attaque au corps-à-corps (et soumis à la même résolution simultanée, section 4.1). Le projectile affiché est purement visuel.
- **Pas de ligne de vue** : dans cette version, un tir atteint toute cible dans sa portée, même s'il y a entre les deux des obstacles ou d'autres unités (alliées ou ennemies). Une ligne de vue pourra être ajoutée dans une version future (hors scope v1).
- Une attaque à distance **ne peut jamais se déclencher sur une cible adjacente** (case collée) — en dessous de sa portée minimale de 2 cases, une unité à distance ne peut pas tirer.
- **Unité purement à distance (jamais de corps-à-corps)** : elle reste immobile et continue de tirer tant que sa cible reste dans sa portée de tir. Elle ne recule que si la cible devient adjacente (hors de portée par défaut) ; elle ne cherche pas activement à s'éloigner tant qu'elle reste à portée. Pour reculer, elle rejoint la case hors contact la plus proche en contournant si le recul direct est bloqué (bord, obstacle, autre unité). Si elle est complètement encerclée (aucune case hors contact atteignable), elle reste sur place **sans tirer** jusqu'à ce qu'un passage se libère.
- **Unité purement à distance qui tire en avançant (ex : Athos)** : exception à la règle précédente — comme une unité hybride, elle **continue d'avancer** vers sa cible pendant qu'elle tire, mais elle **s'arrête à 2 cases** (sa portée minimale de tir) : elle n'entre jamais au contact, puisqu'elle ne peut pas combattre au corps-à-corps. Si la cible vient malgré tout se coller à elle, elle recule comme toute unité purement à distance.
- **Unité hybride capable des deux modes (ex : Fafnir)** :
  - Elle attaque à distance dès que sa cible entre dans sa portée de tir
  - Contrairement à une unité purement à distance, elle **continue d'avancer** vers sa cible pendant qu'elle tire, plutôt que de rester immobile à distance
  - Elle peut tirer tout en se déplaçant (le tir n'interrompt pas la marche vers la cible)
  - Une fois adjacente à sa cible, elle bascule au corps-à-corps et suit dès lors les règles de la section 4.2

## 5. Commandes du joueur

- Le joueur peut donner 3 types de commandes à une unité déployée :
  1. **Attaquer** : désigner une cible ennemie précise
  2. **Se déplacer** : désigner une case du terrain à atteindre. Si cette case est inatteignable (obstacle, case occupée, bloc 2×2 qui déborderait du terrain), l'unité s'arrête au plus près possible et reprend son comportement autonome.
  3. **Fuir** : l'unité doit atteindre le bord du terrain pour quitter la bataille et revenir dans la liste du joueur ; elle ne récupère pas ses points de vie avant la fin de la bataille
- Donner une commande **met le jeu en pause** (pause d'interaction, section 5.2) : l'ouverture de la barre de commandes arrête le temps dès le clic sur "Commandes", pendant que le joueur choisit l'ordre, l'unité et la cible ; la bataille reprend dès que la commande est donnée ou annulée, **sauf** si la pause principale est active (décision prise après tests de jeu).
- **Déroulé d'une commande** (après ouverture de la barre) :
  - **Voie 1 (guidée)** : choisir l'ordre (Aller, Attaquer, Fuir), puis une unité du joueur, puis la cible — un ennemi pour Attaquer, une case pour Aller, aucune pour Fuir.
  - **Voie 2 (raccourci)** : cliquer directement une unité du joueur sans choisir d'ordre ; l'ordre est déduit de la cible (ennemi = Attaquer, case = Aller). Fuir n'est jamais déduit : il passe obligatoirement par la voie 1.
  - **Annulation** possible à n'importe quel stade : aucune commande n'est émise et le cooldown n'est pas consommé.
- Les commandes sont **optionnelles** : une unité sans commande agit de façon autonome (se déplace vers l'ennemi le plus proche, attaque à portée).
- **Priorité des commandes :** une unité n'a qu'une commande à la fois. La **dernière commande donnée remplace toujours la précédente**, quelle qu'elle soit (Aller, Attaquer ou Fuir).
- **Commande Aller :** pendant le trajet, l'unité **ne combat pas** (ni attaque ni riposte), même si elle est frappée. Arrivée sur la case, la commande prend fin et l'unité reprend son comportement autonome.
- **Commande Attaquer :**
  - Elle l'emporte sur l'engagement (section 4.2) : une unité engagée au corps-à-corps quitte son combat pour aller vers la cible désignée.
  - Une unité à distance avance jusqu'à avoir la cible à portée, puis tire selon ses règles habituelles (section 4.5).
  - La commande prend fin quand la cible meurt ou fuit le terrain, ou quand une nouvelle commande (Aller ou Fuir) est donnée à l'unité. L'unité reprend alors son comportement autonome (ou exécute la nouvelle commande).
- **Fuite d'une unité engagée** : la fuite est toujours possible immédiatement, même en plein engagement corps-à-corps. L'ennemi engagé a le droit de porter une dernière attaque au moment où l'unité se désengage. Si **plusieurs ennemis** sont engagés au corps-à-corps sur elle, **chacun** porte sa dernière attaque, une seule fois (au moment où la fuite commence). Cette dernière attaque est **gratuite** : elle ne modifie pas le rythme d'attaque de l'ennemi (section 4.1) et **ne compte pas** comme une attaque portée pour les aptitudes (compteurs « toutes les N attaques », section 6.1). La fuite vise la case de bord atteignable la plus proche, n'importe laquelle : un bord bloqué est contourné.
  - Une unité déjà sur un bord quitte le terrain dès que l'ordre de fuite est donné.
  - **Aucun bord atteignable** (unité encerclée par d'autres unités, ou entrée du « Fort » bouchée) : l'unité reste en fuite sur place, mais **riposte au corps-à-corps** contre un ennemi adjacent, à son rythme d'attaque habituel (section 4.1). Une unité purement à distance, qui ne peut pas frapper au contact (section 4.5), ne riposte pas. Dès qu'un chemin vers un bord se libère, l'unité cesse de riposter et reprend sa fuite.
  - Après leur dernière attaque, les ennemis peuvent poursuivre l'unité en fuite et la frapper s'ils la rattrapent : fuir comporte un risque.
  - Une nouvelle commande (Aller, Attaquer) donnée à une unité en fuite remplace la fuite (priorité à la dernière commande, voir plus haut).

### 5.1 Limitation des commandes
- Le nombre de commandes est limité par un **cooldown** entre deux commandes (pas de quota fixe par bataille en v1).
- Durée du cooldown : **5 secondes** de temps de bataille entre deux commandes. Le cooldown **ne s'écoule pas pendant les pauses** (section 5.2). Pendant le cooldown, la barre de commandes ne peut pas s'ouvrir.
- Cette limitation de cooldown diminue avec le niveau du joueur (mécanique de déblocage progressif — détail de la courbe hors scope v1, une seule valeur fixe suffit pour la v1).

### 5.2 Pauses
Deux familles de pause, indépendantes et combinables. Le temps de bataille ne s'écoule que si **aucune** n'est active.

- **Pause principale** : interrupteur activé et désactivé par le joueur (bouton ⏸ / ▶, raccourci barre Espace). Pendant cette pause, le joueur peut encore déployer et donner une commande.
- **Pause d'interaction** : automatique pendant un glisser-déposer de déploiement (section 2), pendant la sélection d'une commande (dès l'ouverture de la barre, section 5) et pendant la confirmation d'abandon (section 8.2 ; une commande en cours de sélection est alors annulée). Elle se termine d'elle-même à la fin ou à l'annulation du geste.
- **Gel du tutoriel** (`technical.md` 5.5) : pendant une étape qui demande ou explique quelque chose, la bataille est figée comme pendant une pause, et seule l'action demandée est possible.
- Pendant toute pause, **tous les compteurs sont gelés** : timers d'attaque, mouvements, cooldown des commandes, script de l'IA (section 7) et compte à rebours de 15 secondes (section 8.2). Les animations des unités sont gelées elles aussi.
- Le cooldown étant gelé, **une seule commande est possible par pause principale**.
- Le déploiement reste possible **plusieurs fois** pendant une pause principale, dans la limite du plafond de points de présence (section 2).
- Après un déploiement ou une commande effectués pendant la pause principale, le jeu **reste en pause** jusqu'à ce que le joueur la relance.

## 6. Aptitudes

- Les **aptitudes** sont des pouvoirs spéciaux propres à certains monstres — une stat séparée des autres caractéristiques d'une unité (voir design doc section 2.2).
- Toutes les unités n'ont pas d'aptitude ; c'est une stat optionnelle propre à certains individus/espèces.
- Une aptitude appartient à l'un des deux types suivants :

### 6.1 Type automatique
- Se déclenche seule selon sa propre condition (ex : après un certain nombre d'attaques), **sans action du joueur**.
- Exemple pour la v1 : l'attaque dévastatrice de Fafnir (voir `units.md`).
- Une attaque annulée par un effet (ex. : Frappe paralysante d'Athos) ne compte pas dans les compteurs « toutes les N attaques ». Seules les attaques réellement portées comptent. La dernière attaque gratuite portée sur une unité qui fuit (section 5) ne compte pas non plus.

### 6.2 Type à usage limité
- Le joueur **choisit lui-même le moment d'activation**, via une icône dédiée sur le côté de l'écran.
- Utilisable un nombre limité de fois par bataille (ex : 1 fois par bataille).
- Aucune unité du roster v1 n'a d'aptitude de ce type pour l'instant.

Les aptitudes spécifiques de chaque unité (déclencheur exact, effet, valeurs) sont documentées dans [`units.md`](units.md), avec les autres stats.

## 7. Comportement de l'IA adverse

- L'IA ne gère aucune ressource dynamiquement (pas d'achat, pas de progression) — son comportement est entièrement scripté.
- Le script définit à l'avance, pour une bataille donnée : quelle unité est déployée et à quel instant précis depuis le début de la bataille. La case d'apparition n'est pas fixée à l'avance : elle est choisie au moment du déploiement selon la situation du terrain (voir 7.2).
- La bataille 01 est scriptée (section 7.1). Les batailles de « Partir en guerre » (`roadmap-mvp.md`) le seront aussi ; leur nombre et leurs scripts restent à définir (section 10).
- Une fois déployée, une unité IA se comporte exactement comme une unité du joueur non commandée : mouvement et combat autonomes selon les mêmes règles (sections 3 et 4).

### 7.1 Script de bataille v1
Le même schéma de timing s'applique quelle que soit la faction jouée par l'IA (déterminée par le choix du joueur — voir section 8) : 4 unités basiques, 1 unité [Vol] à distance, 1 unité [Légendaire], déployées progressivement en 5 vagues.

**Si l'IA joue les Wyrms :**
- t=0s : déployer 1 Ver de Lambton
- t=8s : déployer 1 Amphiptère
- t=20s : déployer 1 Ver de Lambton
- t=28s : déployer 2 Vers de Lambton
- t=35s : déployer Fafnir

Coût total du script : 175 points de présence (10 + 25 + 10 + 2 × 10 + 110).

**Si l'IA joue les Morts-Vivants :**
- t=0s : déployer 1 New-reborn Skeleton
- t=8s : déployer 1 Necromant Initiate
- t=20s : déployer 1 New-reborn Skeleton
- t=28s : déployer 2 New-reborn Skeletons
- t=35s : déployer Athos

Coût total du script : 159 points de présence (6 + 25 + 6 + 2 × 6 + 110).

Le coût total d'un script n'est pas un budget : ce qui limite l'IA, c'est le même **plafond simultané de 150 points** que le joueur (voir ci-dessous). Conséquence : à t=35s, la [Légendaire] (110) n'apparaît que si les unités IA encore sur le terrain totalisent 40 points ou moins. Tant que toutes les unités des vagues précédentes sont en vie, elle attend — Fafnir derrière 65 points, Athos derrière 49 points.

**Plafond de présence :** l'IA est soumise au même plafond vivant de 150 points que le joueur (section 2) : les unités IA encore sur le terrain comptent, et une unité du script qui ferait dépasser le plafond **attend** qu'assez de points se libèrent (mort d'une unité IA ; l'IA ne fait jamais fuir ses unités) ; les unités suivantes du script attendent derrière elle pour garder l'ordre.

> Horaires et unités de ce script provisoires : à revoir (nouvelle règle à venir, avec une mécanique d'équilibrage des forces sur le terrain).

### 7.2 Choix de la case d'apparition : entrée par le bord droit
Les unités de l'IA **entrent par le bord droit du terrain** : elles n'apparaissent jamais directement au milieu du champ de bataille. Le joueur les voit arriver et traverser le terrain, ce qui lui laisse le temps de réagir (décision de design : une apparition soudaine au contact paraissait injuste).

Au moment de déployer une unité, l'IA choisit sa case **au hasard** parmi les positions retenues par les filtres suivants, appliqués dans l'ordre :

1. **Valide** : bloc entier (2×2 compris) **collé au bord droit** (dernière colonne, ou les deux dernières pour un 2×2), sur des cases libres (ni obstacle, ni unité). Si le bord est plein, le déploiement attend qu'une case se libère (les entrées suivantes du script aussi, pour garder l'ordre).
2. **Stratégique** : parmi celles-ci, les positions dont la **rangée est la plus proche** d'une **cible stratégique** (définition ci-dessous).

S'il n'y a aucun ennemi sur le terrain, la case est tirée parmi toutes les positions valides du bord.

Les unités d'une même vague (même instant du script) entrent ensemble. S'il y a au moins un ennemi sur le terrain, elles se placent sur des rangées voisines ; sinon, la case de chacune est tirée au hasard sur le bord. À l'écran, chaque unité arrive depuis l'extérieur du terrain jusqu'à sa case d'entrée (animation purement visuelle), puis se comporte comme n'importe quelle unité (sections 3 et 4).

**Cible stratégique**, par ordre de priorité :
1. **Renfort** : un ennemi engagé au corps-à-corps avec un allié qui a 50 % de ses PV max ou moins (dans un sens ou dans l'autre de l'engagement). Si au moins une cible de renfort existe, seules celles-ci comptent.
2. **Éradication** : sinon, le ou les ennemis qui ont le plus de PV actuels.

### 7.3 Bataille en plusieurs phases (bataille-clickbait)
Une bataille peut enchaîner plusieurs **phases**, chacune avec son propre script IA et sa propre zone. La bataille de la version clickbait (`technical.md` 5.6) en a trois. La bataille 01 du MVP en aura plusieurs elle aussi, en reprenant ces zones (`roadmap.md`) — nombre de phases, scripts de chaque phase et condition de victoire (section 8.1) encore à définir ; en attendant, la bataille 01 actuelle n'a qu'une phase.

- **Fin d'une phase** : quand l'IA a déployé tout le script de la phase **et** qu'elle n'a plus aucune unité sur le terrain. Ce n'est pas une victoire : s'il reste une phase, la bataille continue.
- **Transition** : tout est figé (aucune action possible, compteurs gelés) pendant que l'armée du joueur présente sur le terrain part vers la droite, puis entre par la gauche dans la zone suivante. Chaque unité arrive sur la case libre la plus à gauche de sa rangée (ou de la rangée libre la plus proche), les unités les plus avancées en premier. Les commandes en cours sont annulées. Seule exception : le bouton Abandonner reste utilisable pendant la transition (section 8.2).
- **Fin d'une phase et élimination du joueur au même instant** (plus aucune unité sur le terrain ni en réserve) : défaite immédiate, sans transition vers la zone suivante.
- **Zones** : chaque phase a ses propres obstacles, dessinés pour poser une question au joueur (plans ASCII et propriétés vérifiées : `src/data/battlefield.js`, `tests/logic/clickbaitZones.test.js`). La même image de fond sert à toutes les zones, affichée dans un sens ou dans l'autre. Dans toutes les zones, le bord d'entrée de l'IA (dernière colonne) reste libre, aucune case libre n'est isolée, et une Légendaire 2×2 peut traverser.
  - **Phase 1** : terrain de la bataille 01 (section 1).
  - **Phase 2 — « Le mur »** (fond retourné) : un mur de rochers qui serpente (colonnes 14-17), percé d'un passage étroit d'une case (rangée 3 — une Légendaire 2×2 n'y passe pas) et d'un passage large de deux cases (rangées 10-11). Les tireurs ennemis tirent par-dessus le mur (pas de ligne de vue, section 4.5) ; les unités [Vol] le survolent.
  - **Phase 3 — « Le fort »** (provisoire, fond normal) : une ruine en fer à cheval côté joueur, salle intérieure de 4×4 cases, ouverte vers l'ennemi par une entrée de deux cases. Elle protège du corps-à-corps mais pas des tirs. C'est un cul-de-sac assumé : exception à la règle « pas de cul-de-sac » de la section 1, qui ne vaut que pour la bataille 01.
  - En réserve (validé, pas encore utilisé) : **« Les trois couloirs »**, deux crêtes qui séparent trois couloirs, franchissables seulement en volant.
- **Murs** : les rochers d'un mur se touchent par un côté. Une unité au sol ne coupe jamais le coin d'un rocher (section 3).
- **Ce qui est conservé** : les morts restent perdus, les PV perdus ne reviennent pas. La réserve du joueur (copies jamais déployées, unités revenues de fuite) reste déployable dans la moitié gauche de la nouvelle zone, avec le même plafond de 150 points. Le cooldown des commandes continue.
- **Script de la phase suivante** : ses instants sont comptés depuis le début de la phase.
- **Victoire de la bataille-clickbait** : dès que l'IA est à la fin du script de la **dernière** phase et qu'elle n'a plus aucune unité vivante sur le terrain — sans le compte à rebours de 15 secondes de la section 8.2, même s'il lui reste des copies en réserve. Si le joueur est éliminé au même instant, c'est un match nul (section 8.1). La défaite du joueur, elle, suit les règles habituelles (section 8).

**Scripts provisoires des phases 1 à 3** (à ajuster), instants comptés depuis le début de chaque phase.

Phase 1 (vagues de la bataille 01 resserrées, sans Légendaire) :
- Si l'IA joue les Wyrms : t=0s 1 Ver de Lambton, t=4s 1 Amphiptère, t=10s 1 Ver de Lambton, t=14s 2 Vers de Lambton.
- Si l'IA joue les Morts-Vivants : t=0s 1 New-reborn Skeleton, t=4s 1 Necromant Initiate, t=10s 1 New-reborn Skeleton, t=14s 2 New-reborn Skeletons, t=18s 2 New-reborn Skeletons.

Phase 2 :
- Si l'IA joue les Wyrms : t=0s 2 Vers de Lambton, t=12s 1 Ver de Lambton.
- Si l'IA joue les Morts-Vivants : t=0s 2 New-reborn Skeletons, t=5s 1 Necromant Initiate, t=12s 2 New-reborn Skeletons, t=18s 2 New-reborn Skeletons.

Phase 3 (une nuée d'abord — le fort la retient —, puis des tireurs — le fort devient un piège) :
- Si l'IA joue les Wyrms : t=0s 3 Vers de Lambton, t=10s Fafnir.
- Si l'IA joue les Morts-Vivants : t=0s 4 New-reborn Skeletons, t=10s 2 Necromant Initiates, t=15s 2 New-reborn Skeletons, t=20s Athos (il attend sous le plafond de 150 points, section 7.1).

## 8. Fin de bataille

### 8.1 Victoire immédiate
- Si toutes les unités du camp adverse sont mortes (aucune copie restante en réserve, aucune unité vivante sur le terrain), victoire immédiate pour l'autre camp.
- **Cas d'égalité (draw) :** la résolution simultanée des dégâts (section 4.1) rend possible une élimination mutuelle au même instant — les deux camps perdent leur dernière unité au même frame, sans copie restante en réserve d'aucun côté. Dans ce cas, la bataille se termine sur un **match nul**, sans vainqueur. Aucune règle de départage n'est nécessaire : un match nul ne rapporte aucune récompense (section 11.3). Un match nul n'est pas une victoire : la bataille tutoriel n'est pas validée, le joueur voit un écran « Match nul » et peut réessayer, comme après une défaite (voir `technical.md` 5.1).
- **Réserves de l'IA :** dans la bataille 01, l'IA dispose des copies de `units.md` ; une fois son script terminé et son terrain vide, il lui reste donc des réserves qu'elle ne redéploie jamais, et la section 8.2 s'applique (victoire du joueur après 15 s). La bataille-clickbait fait exception : victoire immédiate dès la fin du script de la dernière phase (section 7.3).

### 8.2 Terrain vide avec réserves restantes
- Si un camp n'a **aucune unité actuellement déployée** sur le terrain (toutes mortes ou en fuite) mais possède encore des **copies non utilisées en réserve**, ce camp reçoit un avertissement avec un **compte à rebours de 15 secondes**.
- Le compte à rebours ne concerne qu'un camp qui a déjà eu au moins une unité sur le terrain. En début de bataille, le joueur n'a aucun délai pour son premier déploiement.
- Pendant ce délai, le camp concerné doit redéployer au moins une unité pour continuer la bataille.
- Si le compte à rebours expire sans redéploiement, ou si le joueur choisit explicitement d'abandonner (bouton Abandonner, disponible à tout moment de la bataille, tutoriel compris, avec confirmation), c'est une **défaite automatique** pour ce camp — mais ses unités survivantes en réserve ne sont **pas exterminées** (elles restent disponibles pour la suite, contrairement à une unité tuée au combat qui est perdue définitivement, voir section 4.4).
- Cette règle s'applique symétriquement au joueur et à l'IA.
- **Expiration simultanée :** si les comptes à rebours des deux camps expirent au même instant, c'est une **défaite du joueur** (pas un match nul).

## 9. Roster

Deux factions sont disponibles en v1 : **Souveraine des Wyrms** et **Souverain des Morts-Vivants**. Le joueur choisit l'une des deux en début de partie ; l'IA contrôle automatiquement l'autre, pour éviter que le joueur affronte sa propre armée en miroir. Chaque faction dispose d'un roster minimal de 3 unités (une basique, une [Vol], une [Légendaire]).

Les stats précises de chaque unité (points de vie, dégâts, coût, vitesses, portée, aptitudes) sont des **données**, pas des règles — voir le document séparé [`units.md`](units.md).

**Plafond simultané sur le terrain : 150 points de présence par camp** (section 2). À ne pas confondre avec le plafond de l'armée, 500 points (section 11.2), qui limite ce que le joueur emmène en bataille.

## 10. Valeurs à définir

Les valeurs de la bataille sont tranchées. Restent ouvertes, pour la couche méta (section 11) :
- somme de départ en Spirit Stones, et moment où elle est donnée ;
- récompense de la victoire de la bataille 01 (montant, fixe ou liée aux pertes) ;
- coefficient de prix k, et multiplicateur éventuel du [Légendaire] ;
- nom par défaut de l'armée de départ ;
- contenu de « Partir en guerre » (batailles, récompenses, conséquences d'une défaite).

## 11. Couche méta (jeu normal, hors version clickbait)

Détail du périmètre et des écrans : `roadmap-mvp.md`. Aucune de ces règles ne s'applique à la version clickbait, où rien n'est sauvegardé.

### 11.1 Individus possédés
- Le joueur possède une **liste d'individus**. Un individu n'a que deux caractéristiques : un **identifiant unique** et son **espèce**. Ses stats sont celles de l'espèce (`units.md`).
- **Dotation de départ** : au choix de la faction, le joueur reçoit, pour chaque espèce de sa faction, autant d'individus que la colonne « Copies de départ » de `units.md` (ex : Wyrms : 12 Vers de Lambton, 8 Amphiptères, 1 Fafnir).
- **Pertes** : à la victoire de la bataille 01, chaque individu tué pendant la bataille est retiré de la liste. Une tentative perdue ou un match nul ne retire aucun individu.
- L'interface regroupe toujours les individus **par espèce** : deux individus de la même espèce sont indiscernables pour le joueur.

### 11.2 Armée
- L'**armée** est une liste d'identifiants d'individus possédés, avec un **nom**.
- Le joueur n'a **qu'une armée**. Les emplacements supplémentaires sont hors scope (`roadmap-mvp.md`).
- **Plafond** : la somme des coûts en points de présence de ses individus ne dépasse jamais **500**. Ce plafond est distinct du plafond simultané de 150 points sur le terrain (section 2).
- **Minimum** : l'armée contient au moins **1 individu**.
- **Composition** : le joueur ajoute ou retire des individus **par espèce**, un à la fois. Un ajout qui ferait dépasser 500 est impossible, tout comme le retrait du dernier individu de l'armée. Les individus d'une espèce étant indiscernables (11.1), n'importe lequel peut être ajouté ou retiré.
- **Renommage** : le joueur peut renommer l'armée à tout moment depuis la gestion de civilisation.
  - Le nom fait de **1 à 20 caractères**, sans filtre (accents, chiffres, emojis acceptés).
  - Validation par Entrée ou par un bouton ✓, annulation par Échap.
  - Un nom vide ou fait uniquement d'espaces est refusé : l'ancien nom est conservé.
- **Armée de départ** : créée automatiquement à la victoire de la bataille 01, avec **tous les individus survivants**. Les dotations de départ totalisent au plus 430 points (Wyrms) et 418 points (Morts-Vivants) : elles tiennent toujours sous le plafond.
- **Mort d'un individu** : il est retiré de l'armée en même temps que de la liste des individus possédés (11.1).

### 11.3 Spirit Stones
- Monnaie du jeu (nom provisoire). Le solde est un **nombre entier**, jamais négatif, affiché en haut à droite de l'écran d'accueil.
- **Gains** : une somme de départ, puis une récompense à chaque victoire (bataille 01, puis batailles de « Partir en guerre »). Montants : section 10.
- **Défaite, abandon ou match nul** : aucune récompense.

### 11.4 Invocation
- L'écran Invocation propose chaque espèce de la faction du joueur. Invoquer, c'est **payer son prix** et **ajouter un nouvel individu** de cette espèce à la liste (11.1).
- **Prix** : coût en points de présence de l'espèce × k, avec un multiplicateur éventuel pour le [Légendaire] (valeurs : section 10).
- **Solde insuffisant** : l'invocation est impossible (bouton désactivé).
- **Confirmation** : un clic invoque directement une unité non légendaire. La réinvocation du [Légendaire] passe par une boîte de confirmation (« Réinvoquer [nom] pour X Spirit Stones ? ») ; l'annuler ne dépense rien.
- **Espèces non légendaires** : aucun plafond de possession.
- **[Légendaire]** : au plus **un** individu possédé. Tant qu'il est vivant, l'invocation est impossible (« Déjà à vos côtés ») ; s'il est mort, elle est possible et s'appelle « Réinvoquer ». Rachat et réinvocation sont la même action : pas de délai, pas de coût croissant.
- Pas de gacha : seules les espèces du roster de la faction du joueur sont proposées.
- Un individu invoqué **n'est pas ajouté à l'armée** : le joueur l'y ajoute lui-même depuis la gestion de civilisation (11.2).