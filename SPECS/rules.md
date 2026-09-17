# RULES.md — Scope v1

Règles du jeu en détail, chiffrées. Chaque ligne doit être vérifiable en jouant une bataille.

Ce fichier couvre uniquement le **scope v1** (moteur de bataille). Voir `roadmap.md` pour ce qui est repoussé en v2+.

---

## 1. Terrain

- Le terrain de bataille est une grille rectangulaire de **24 cases de large × 14 cases de haut**.
- Deux unités ne peuvent jamais occuper la même case.
- Certaines cases peuvent être des obstacles infranchissables. Pour la bataille v1 : **8 obstacles d'une case chacun**, dispersés sur le terrain plutôt que concentrés, en évitant de former des couloirs fermés ou des culs-de-sac (position exacte à définir en phase de construction du niveau).

## 2. Déploiement

- Le joueur peut déployer ses unités sur **toute sa moitié du terrain** (12 colonnes de large sur les 24), pas seulement sur une ligne de départ.
- Déposer une unité sur le terrain **arrête le temps** : la bataille se met en pause pendant que le joueur choisit et positionne son unité.
- Le déploiement est limité par les **points de présence** disponibles : le joueur dispose d'un plafond de **150 points de présence pouvant être déployés simultanément** (voir section 9 et `units.md` pour le détail du coût de chaque unité).
- Ce plafond est **vivant, pas un budget dépensé une seule fois** : le coût en points de présence d'une unité se libère dès qu'elle meurt ou fuit le terrain (commande de retraite, section 5), permettant au joueur de redéployer d'autres unités en cours de bataille tant que le total des unités actuellement sur le terrain reste sous le plafond.
- **Limite de quantité par unité [Légendaire] :** un seul exemplaire de l'unité [Légendaire] d'une faction (Fafnir ou Athos selon le camp) peut être déployé simultanément sur le terrain, indépendamment du budget de points disponible.
- **Copies disponibles pour la bataille :** chaque unité (légendaire ou non) dispose d'un nombre fixe de copies pour une même bataille (voir `units.md` pour le détail par unité).
  - Une unité **tuée** en combat consomme définitivement une copie (perdue pour le reste de la bataille, cohérent avec la mort définitive, section 4.4).
  - Une unité qui **fuit** (retraite, section 5) retourne en réserve avec ses points de vie réduits conservés, et **reste disponible** pour un redéploiement ultérieur dans la même bataille — sa copie n'est pas perdue.
- L'IA se déploie sur l'autre moitié du terrain (12 colonnes), selon un script prédéfini (voir section 7).

## 3. Mouvement

- Le déplacement est possible en 8 directions (y compris diagonale).
- Une unité se déplace vers l'ennemi le plus proche par défaut, en contournant les obstacles et les autres unités qui bloquent le passage.
- Chaque unité a sa propre vitesse de déplacement (voir `units.md` pour les valeurs du roster).
- **Unités occupant 4 cases (2×2) :** se déplacent comme un bloc rigide — un déplacement n'est valide que si les 4 cases de destination sont toutes libres. Si le passage est trop étroit (couloir d'une seule case de large), l'unité attend ou contourne, exactement comme une unité normale face à un obstacle.
- **Unités [Vol] :** ignorent les obstacles terrestres dans leur pathfinding — un obstacle qui bloquerait une unité au sol n'a aucun effet sur leur trajectoire. Cette règle ne s'applique qu'aux obstacles de terrain : les autres unités continuent de bloquer le passage normalement (deux unités ne peuvent jamais occuper la même case, voir section 1).

## 4. Combat

### 4.1 Déroulement dans le temps
- Le temps de bataille s'écoule en continu (pas de tour par tour). Chaque unité attaque selon son propre rythme, déterminé par sa vitesse d'attaque (voir `units.md` pour les valeurs du roster).
- Quand plusieurs unités infligent des dégâts au même instant, **toutes les attaques de cet instant sont d'abord calculées, puis appliquées ensemble** — aucune unité n'a d'avantage d'ordre sur une autre. Concrètement : si deux unités s'entretuent au même instant, elles meurent toutes les deux.

### 4.2 Engagement au corps-à-corps
- Si deux unités alliées veulent attaquer la même cible au corps-à-corps, la seconde arrivée contourne la première pour trouver une case libre également adjacente à la cible.
- S'il n'y a plus de case adjacente libre sur cette cible, l'unité **se redirige vers le prochain ennemi le plus proche** plutôt que d'attendre. Elle n'attend qu'une place se libère que s'il ne reste **aucun autre ennemi** disponible à attaquer (le premier ennemi occupé est alors la seule option restante).
- Une unité **engagée** (en train d'échanger des attaques au corps-à-corps) ne peut pas changer de cible tant que l'ennemi n'est pas mort.
- Une unité alliée en attente d'une place libre peut, elle, se rediriger vers un autre ennemi qui se rapproche.

### 4.3 Adjacence des unités 4 cases (2×2)
- Une unité occupant 4 cases est considérée **adjacente à une cible** dès qu'**une seule** de ses 4 cases touche une case adjacente à la cible (pas besoin que le bloc entier soit collé).

### 4.4 Mort
- Quand les points de vie d'une unité atteignent 0, elle meurt et est retirée du terrain.
- Une unité morte en bataille est perdue définitivement, sauf mécanismes de réinvocation (hors scope v1, voir `roadmap.md`).

### 4.5 Attaque à distance
- Une unité à distance a une **portée de tir**, une valeur fixe propre à l'unité (voir `units.md` pour les valeurs du roster).
- Une attaque à distance **ne peut jamais se déclencher sur une cible adjacente** (case collée) — en dessous de sa portée minimale de 2 cases, une unité à distance ne peut pas tirer.
- **Unité purement à distance (jamais de corps-à-corps)** : elle reste immobile et continue de tirer tant que sa cible reste dans sa portée de tir. Elle ne recule que si la cible devient adjacente (hors de portée par défaut) ; elle ne cherche pas activement à s'éloigner tant qu'elle reste à portée.
- **Unité hybride capable des deux modes (ex : Fafnir)** :
  - Elle attaque à distance dès que sa cible entre dans sa portée de tir
  - Contrairement à une unité purement à distance, elle **continue d'avancer** vers sa cible pendant qu'elle tire, plutôt que de rester immobile à distance
  - Elle peut tirer tout en se déplaçant (le tir n'interrompt pas la marche vers la cible)
  - Une fois adjacente à sa cible, elle bascule au corps-à-corps et suit dès lors les règles de la section 4.2

## 5. Commandes du joueur

- Le joueur peut donner 3 types de commandes à une unité déployée :
  1. **Attaquer** : désigner une cible ennemie précise
  2. **Se déplacer** : désigner une case du terrain à atteindre
  3. **Fuir** : l'unité doit atteindre le bord du terrain pour quitter la bataille et revenir dans la liste du joueur ; elle ne récupère pas ses points de vie avant la fin de la bataille
- Donner une commande **ne met pas le jeu en pause** : le temps continue de s'écouler normalement.
- Les commandes sont **optionnelles** : une unité sans commande agit de façon autonome (se déplace vers l'ennemi le plus proche, attaque à portée).
- **Fuite d'une unité engagée** : la fuite est toujours possible immédiatement, même en plein engagement corps-à-corps. L'ennemi engagé a le droit de porter une dernière attaque au moment où l'unité se désengage.

### 5.1 Limitation des commandes
- Le nombre de commandes est limité par un **cooldown** entre deux commandes (pas de quota fixe par bataille en v1).
- Durée du cooldown : **5 secondes** entre deux commandes.
- Cette limitation de cooldown diminue avec le niveau du joueur (mécanique de déblocage progressif — détail de la courbe hors scope v1, une seule valeur fixe suffit pour la v1).

## 6. Aptitudes

- Les **aptitudes** sont des pouvoirs spéciaux propres à certains monstres — une stat séparée des autres caractéristiques d'une unité (voir design doc section 2.2).
- Toutes les unités n'ont pas d'aptitude ; c'est une stat optionnelle propre à certains individus/espèces.
- Une aptitude appartient à l'un des deux types suivants :

### 6.1 Type automatique
- Se déclenche seule selon sa propre condition (ex : après un certain nombre d'attaques), **sans action du joueur**.
- Exemple pour la v1 : l'attaque dévastatrice de Fafnir (voir `units.md`).

### 6.2 Type à usage limité
- Le joueur **choisit lui-même le moment d'activation**, via une icône dédiée sur le côté de l'écran.
- Utilisable un nombre limité de fois par bataille (ex : 1 fois par bataille).
- Aucune unité du roster v1 n'a d'aptitude de ce type pour l'instant.

Les aptitudes spécifiques de chaque unité (déclencheur exact, effet, valeurs) sont documentées dans [`units.md`](units.md), avec les autres stats.

## 7. Comportement de l'IA adverse

- L'IA ne gère aucune ressource dynamiquement (pas d'achat, pas de progression) — son comportement est entièrement scripté.
- Le script définit à l'avance, pour une bataille donnée : quelle unité est déployée, à quel instant précis depuis le début de la bataille, et à quelle position.
- Pour la v1, **une seule bataille scriptée** est prévue (pas de courbe de difficulté sur plusieurs batailles).
- Une fois déployée, une unité IA se comporte exactement comme une unité du joueur non commandée : mouvement et combat autonomes selon les mêmes règles (sections 3 et 4).

### 7.1 Script de bataille v1
Le même schéma de timing s'applique quelle que soit la faction jouée par l'IA (déterminée par le choix du joueur — voir section 8) : 2 unités basiques, 1 unité [Vol] à distance, 1 unité [Légendaire], déployées progressivement.

**Si l'IA joue les Wyrms :**
- t=0s : déployer 1 Ver de Lambton
- t=8s : déployer 1 Amphiptère
- t=20s : déployer 1 Ver de Lambton
- t=35s : déployer Fafnir

Budget total : 155 points de présence.

**Si l'IA joue les Morts-Vivants :**
- t=0s : déployer 1 New-reborn Skeleton
- t=8s : déployer 1 Necromant Initiate
- t=20s : déployer 1 New-reborn Skeleton
- t=35s : déployer Athos

Budget total : 147 points de présence.

Les deux budgets restent proches du budget du joueur (150 points), pour une bataille équilibrée quel que soit le sens du choix de faction.

## 8. Fin de bataille

### 8.1 Victoire immédiate
- Si toutes les unités du camp adverse sont mortes (aucune copie restante en réserve, aucune unité vivante sur le terrain), victoire immédiate pour l'autre camp.
- **Cas d'égalité (draw) :** la résolution simultanée des dégâts (section 4.1) rend possible une élimination mutuelle au même instant — les deux camps perdent leur dernière unité au même frame, sans copie restante en réserve d'aucun côté. Dans ce cas, la bataille se termine sur un **match nul**, sans vainqueur. Aucune règle de départage n'est nécessaire pour la v1 (pas de récompenses post-bataille à distribuer, voir `roadmap.md`).

### 8.2 Terrain vide avec réserves restantes
- Si un camp n'a **aucune unité actuellement déployée** sur le terrain (toutes mortes ou en fuite) mais possède encore des **copies non utilisées en réserve**, ce camp reçoit un avertissement avec un **compte à rebours de 15 secondes**.
- Pendant ce délai, le camp concerné doit redéployer au moins une unité pour continuer la bataille.
- Si le compte à rebours expire sans redéploiement, ou si le joueur choisit explicitement d'abandonner, c'est une **défaite automatique** pour ce camp — mais ses unités survivantes en réserve ne sont **pas exterminées** (elles restent disponibles pour la suite, contrairement à une unité tuée au combat qui est perdue définitivement, voir section 4.4).
- Cette règle s'applique symétriquement au joueur et à l'IA.

## 9. Roster

Deux factions sont disponibles en v1 : **Souveraine des Wyrms** et **Souverain des Morts-Vivants**. Le joueur choisit l'une des deux en début de partie ; l'IA contrôle automatiquement l'autre, pour éviter que le joueur affronte sa propre armée en miroir. Chaque faction dispose d'un roster minimal de 3 unités (une basique, une [Vol], une [Légendaire]).

Les stats précises de chaque unité (points de vie, dégâts, coût, vitesses, portée, aptitudes) sont des **données**, pas des règles — voir le document séparé [`units.md`](units.md).

**Budget total de chaque camp : 150 points de présence.**

## 10. Valeurs à définir

Toutes les valeurs chiffrées du scope v1 ont été tranchées, y compris le roster de la faction adverse et les conditions de fin de bataille. Cette section sera réutilisée si de nouveaux points restent ouverts.