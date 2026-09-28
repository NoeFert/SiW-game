# UNITS.md — Scope v1

Stats des unités des deux factions. Ce fichier contient des **données**, pas des règles — pour le fonctionnement des mécaniques (comment le corps-à-corps, le tir à distance, les aptitudes se comportent), voir `rules.md`.

**Budget de chaque camp (joueur ou IA) : 150 points de présence simultanés** (plafond vivant, voir `rules.md` 2). Le joueur choisit l'une des deux factions, l'IA joue l'autre (`rules.md` 9).

---

## Faction : Wyrms

| Unité | Keywords | Attaque | Taille | Coût | PV | Dégâts | Vitesse dépl. | Vitesse atk | Portée | Copies disponibles |
|---|---|---|---|---|---|---|---|---|---|---|
| Ver de Lambton | (basique) | Corps-à-corps | 1 case | 10 | 40 | 8 | 1,25 case/s | 1,0 s | — | 12 |
| Amphiptère | [Vol] | À distance | 1 case | 25 | 18 | 10 | 2 cases/s | 1,3 s | 4 cases | 8 |
| Fafnir the Cursed One | [Légendaire], [Vol] | Hybride (voir `rules.md` 4.5) | 4 cases (2×2) | 110 | 220 | 30 (distance) / 45 (corps-à-corps) | 0,75 case/s | 1,8 s | 3 cases | 1 |

### Aptitude — Fafnir : Attaque dévastatrice (automatique)
- Toutes les 5 attaques normales (compteur cumulant distance et corps-à-corps), la 5e attaque inflige **+100% de dégâts** (60 à distance / 90 au corps-à-corps)
- Le compteur se base sur le nombre d'attaques portées, pas sur le temps écoulé

---

## Faction : Morts-Vivants

| Unité | Keywords | Attaque | Taille | Coût | PV | Dégâts | Vitesse dépl. | Vitesse atk | Portée | Copies disponibles |
|---|---|---|---|---|---|---|---|---|---|---|
| New-reborn Skeleton | (basique) | Corps-à-corps | 1 case | 6 | 22 | 5 | 1,25 case/s | 1,0 s | — | 18 |
| Necromant Initiate | [Vol] | À distance | 1 case | 25 | 18 | 10 | 2 cases/s | 1,3 s | 4 cases | 8 |
| Athos the Lord of Pain | [Légendaire], [Vol] | À distance uniquement, tire en avançant (voir `rules.md` 4.5) | 4 cases (2×2) | 110 | 145 | 50 | 0,6 case/s | 2,0 s | 5 cases | 1 |

### Aptitudes — Athos (deux aptitudes automatiques)

**Frappe paralysante :** toutes les 4 attaques, la cible touchée voit sa **prochaine attaque annulée** (elle continue de se déplacer et de combattre normalement ensuite, elle manque simplement son prochain coup).

**Soif de sang :** chaque fois qu'Athos porte le coup fatal sur un ennemi, il **régénère 40 PV** (plafonné à son maximum de 145). Contrairement à la frappe paralysante (garantie tous les 4 coups), cet effet est conditionnel — il ne se déclenche que si Athos porte effectivement le coup qui tue, pas s'il blesse une cible achevée par un allié. Si Athos et un allié tuent la cible au même instant, Athos compte comme ayant porté le coup fatal et se soigne, sauf s'il meurt lui-même à cet instant (voir `rules.md` 4.1).

Ces deux aptitudes ensemble compensent une résistance de base plus faible que celle de Fafnir (145 contre 220 PV) : Athos reste plus vulnérable au burst/focus, mais peut regagner en résilience s'il enchaîne des éliminations — un profil de risque différent, cohérent avec son identité d'artillerie fragile plutôt qu'une simple copie de Fafnir. Valeurs à ajuster en playtesting.

---

## Comparaison d'équilibrage Wyrms / Morts-Vivants

| Paire | DPS/point | PV/point |
|---|---|---|
| Ver de Lambton / New-reborn Skeleton | 0,80 / 0,83 | 4,0 / 3,7 |
| Amphiptère / Necromant Initiate | 0,31 / 0,31 (identiques) | 0,72 / 0,72 (identiques) |
| Fafnir / Athos | 0,27 / 0,23 (sans compter les aptitudes) | 2,0 / 1,32 |

Fafnir et Athos restent volontairement différents dans leur profil (Fafnir = tank offensif hybride, Athos = artillerie fragile avec contrôle + sustain conditionnel), mais leur DPS brut a été rapproché pour éviter qu'une des deux factions soit systématiquement plus forte au choix initial. L'écart en PV/point est assumé et partiellement compensé par la régénération au kill d'Athos, un effet plus aléatoire que le burst garanti de Fafnir. Équilibrage à valider en playtesting.
