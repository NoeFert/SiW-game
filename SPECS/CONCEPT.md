# CONCEPT.md — Sovereign in War

## Le jeu en une phrase

Un jeu de stratégie en temps réel où le joueur, souverain d'une espèce de monstres, déploie ses troupes sur un champ de bataille puis les regarde combattre seules, en n'intervenant que par quelques ordres rares et bien choisis.

## De quoi parle le jeu

Le joueur incarne un souverain : la **Souveraine des Wyrms** (dragons et vers géants) ou le **Souverain des Morts-Vivants** (squelettes et nécromants). L'intelligence artificielle joue l'autre faction.

Une bataille se joue sur une grille de 24 × 14 cases (`RULES.md` section 1) :
- le joueur **déploie** ses monstres dans sa moitié gauche du terrain, par glisser-déposer ;
- les monstres **se battent seuls** : ils avancent vers l'ennemi le plus proche, contournent les obstacles, frappent au corps-à-corps ou tirent à distance ;
- le joueur garde un **contrôle limité** : il peut ordonner à une unité d'attaquer une cible, d'aller sur une case ou de fuir, mais une seule commande toutes les 5 secondes (`RULES.md` section 5).

Le vrai choix stratégique se fait **avant et pendant le déploiement** : chaque monstre coûte des points de présence, et le terrain n'en accepte jamais plus de 150 à la fois (`RULES.md` section 2). Déployer un dragon légendaire, c'est renoncer à une dizaine de petites unités.

## L'objectif du joueur

Gagner la bataille **en perdant le moins d'unités possible**. Une unité tuée est perdue pour de bon ; une unité blessée peut battre en retraite et revenir plus tard dans la bataille, avec ses PV réduits.

## La mécanique « pub » (version clickbait, le POC)

Le thème de la gamejam est le *clickbait game* : un jeu web inspiré des publicités de jeux mobiles.

La version clickbait imite une **publicité de jeu de stratégie** : une bataille courte et spectaculaire, qui montre le cœur du jeu en quelques minutes et donne envie de découvrir le jeu complet derrière. C'est un **aperçu modifié pour tenir dans le format d'une pub** :
- on choisit sa faction, puis on est jeté directement dans la bataille, guidé par un tutoriel très court (déployer, laisser combattre, surveiller les points de présence) ;
- la bataille enchaîne **trois zones** (`RULES.md` section 7.3). À la fin de chaque vague, l'armée survivante traverse vers la zone suivante, en gardant ses blessures et ses morts ;
- chaque zone pose une question tactique au joueur, comme une pub qui met en scène un défi : le champ ouvert, puis **« Le mur »** (un passage étroit qui bloque les grosses unités), puis **« Le fort »** (un abri contre le corps-à-corps, qui devient un piège face aux tireurs) ;
- à la victoire, un **bilan des pertes** montre ce que la bataille a coûté : c'est lui qui mesure la réussite.

## Ce que le MVP ajoute

Le clickbait est construit comme une pub ; le MVP est **le jeu complet, construit comme un jeu**. Il reprend le même moteur de bataille et ajoute tout ce qu'une pub laisse de côté (détail dans `ROADMAP.md`) :
- le **parcours complet** : introduction, choix de faction, bataille, écran de victoire ou de défaite avec « Réessayer », écran d'accueil ;
- les **pertes définitives** : les monstres tués pendant la bataille sont sauvegardés et restent perdus, visibles sur l'écran de gestion de civilisation ;
- le **tutoriel complet**, qui apprend aussi les commandes et la retraite ;
- toutes les fonctionnalités de bataille accessibles au joueur, sans les raccourcis propres au format pub ;
- une **première boucle méta**, organisée autour de l'écran d'accueil (détail dans `roadmap-mvp.md` et `RULES.md` section 11) :
  - la **gestion de civilisation** : consulter ses monstres espèce par espèce, et composer l'**armée** qui partira en guerre (500 points de présence au plus, au-dessus des 150 du terrain : l'armée contient des réserves) ;
  - une monnaie, les **Spirit Stones**, reçue au départ puis en récompense des victoires, et produite en continu par la **Spirit Fountain** de l'accueil, dont la capacité grandit avec le niveau du souverain ;
  - l'**invocation** : dépenser ses Spirit Stones pour racheter des monstres d'espèces connues, ou réinvoquer son Légendaire tombé au combat ;
  - « **Partir en guerre** » : trois batailles qui suivent la bataille 01, à conquérir l'une après l'autre avec son armée. Chacune traverse deux zones ; une bataille gagnée peut être rejouée pour progresser, mais une défaite coûte cher : les monstres tombés sont perdus quand même (`RULES.md` section 11.7) ;
  - les **niveaux** (`RULES.md` sections 11.5 et 11.6) :
    - chaque **monstre** gagne de l'expérience quand il survit à une victoire et quand il achève des ennemis. En montant de niveau (jusqu'au niveau 5), il devient plus robuste et plus fort, sans coûter plus de points de présence : un vétéran vaut plus qu'une recrue sur le terrain. Chaque monstre devient ainsi un individu reconnaissable dans la gestion de civilisation ;
    - le **souverain** progresse lui aussi à chaque victoire, d'autant plus que son armée en sort intacte, et chaque niveau lui rapporte des Spirit Stones ;
    - un **Légendaire** tombé peut être réinvoqué au niveau qu'il avait atteint, contre un prix plus élevé.

La boucle méta donne son poids à l'objectif du joueur : chaque monstre perdu devra être racheté, et chaque Spirit Stone dépensée à reconstruire l'armée ne sert pas à la renforcer. Les niveaux renforcent encore cet enjeu : perdre un monstre, c'est aussi perdre son expérience, et un vétéran racheté repart de zéro.

Pour le Rendu 1, seule la version clickbait est jouable : le bouton « MVP » de l'écran d'introduction est grisé (`TECHNICAL.md` section 5.2).
