# CLAUDE.md

Instructions persistantes pour Claude Code sur ce projet. Lues automatiquement à chaque session.

## Contexte du projet

Jeu de stratégie autobattler en JavaScript / Phaser 3. Les specs complètes vivent dans `SPECS/` et font autorité — ne jamais inventer une règle ou une valeur qui n'y figure pas sans le signaler explicitement à l'utilisateur.

**Assets disponibles** dans `assets/` (voir `assets/README.md` pour le détail) : sprites de Fafnir, Athos, Lambton Worm, New-reborn Skeleton, et le background de la première bataille. Les sprites de l'Amphiptère et du Necromant Initiate ne sont pas encore fournis — utiliser des formes géométriques simples en placeholder en attendant.

Lire dans cet ordre avant toute tâche de code :
1. `SPECS/roadmap.md` — périmètre exact de la v1 (ce qui est inclus/exclu)
2. `SPECS/rules.md` — mécaniques du jeu (comportements, chiffres)
3. `SPECS/units.md` — stats précises des unités des deux factions
4. `SPECS/technical.md` — stack, architecture attendue, stratégie de tests

## Règles de travail

- **Ne jamais mélanger logique de jeu et rendu Phaser.** Le dossier `src/logic/` ne doit avoir aucune dépendance à Phaser (voir `SPECS/technical.md` section 2). Si une tâche semble pousser à violer cette séparation, le signaler avant de coder.
- **Écrire un test Jest pour toute règle de `rules.md` implémentée**, dans `tests/logic/`. Une fonctionnalité de la logique de jeu sans test associé n'est pas considérée terminée.
- **Ne pas ajouter de fonctionnalité hors du scope v1** listé dans `SPECS/roadmap.md`, même si elle semble simple à ajouter (ex : gacha, traits, personnalisation, persistance). Si une tâche demandée touche à ces éléments, le signaler plutôt que de l'implémenter silencieusement.
- **Si une valeur ou une règle nécessaire n'est pas dans `SPECS/`**, demander plutôt que de deviner — les specs sont censées être exhaustives pour la v1, un trou est probablement un oubli à combler.
- **Code, fichiers, dossiers et assets en anglais.** Le jeu sera d'abord en anglais. Les documents dans `SPECS/` restent en français (outils de travail internes), mais tout ce qui touche au code ou aux noms de fichiers utilise l'anglais (ex : `Unit`, `combat.js`, `lambton-worm.png`).
- **DRY et simplicité maximale pour la v1.** Pas d'abstraction ou d'architecture pensée pour anticiper la v2+ (pas de système de plugins, pas de couche de config générique) tant qu'un besoin concret ne l'exige pas. Objectif : le code le plus direct possible pour valider le moteur de bataille.
