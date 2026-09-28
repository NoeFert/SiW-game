# AGENTIC-WORKFLOW.md — Travailler avec l'IA

Le code du jeu est écrit avec **Claude Code**. Les décisions de game design, les règles et la validation restent de mon côté : l'IA implémente, elle ne décide pas.

## Ma boucle de travail

1. **J'écris la règle dans `SPECS/`**, ou je la corrige, dans un prompt envoyé à Claude.
2. **Claude reformule** la règle telle qu'il l'a comprise. Je corrige la reformulation jusqu'à ce qu'elle soit juste : elle sert ensuite de référence claire pour les sessions suivantes.
3. **Claude confirme ce qu'il va faire avant d'implémenter** quoi que ce soit. Rien n'est codé sans ma validation.
4. **Implémentation d'une seule étape à la fois**, pour ne pas mélanger les règles et les fonctionnalités, et garder le périmètre de chaque fonctionnalité clair et précis.
5. **Test Jest** pour toute règle de logique, écrit d'abord quand c'est possible, puis `npm test` et `npm run build`.
6. **Je relis le code** (le diff) avant de commiter.
7. **Je teste en jouant** pour valider à la main ce que les tests ne couvrent pas : rendu, ressenti, lisibilité.
8. **Un commit par étape**, petit et facile à relire.

Régulièrement, je vérifie aussi que la structure du code reste prête à accueillir la suite du jeu (MVP, puis v2+).

## Mes garde-fous

- **`CLAUDE.md`** : instructions lues automatiquement à chaque session. Les SPECS font autorité ; la logique de jeu (`src/logic/`) ne dépend jamais de Phaser ni de React ; rien hors du périmètre de `ROADMAP.md` ; code et noms de fichiers en anglais ; simplicité maximale, pas d'abstraction anticipée.
- **Tests Jest obligatoires** : une règle de `RULES.md` implémentée sans test dans `tests/logic/` n'est pas considérée comme terminée.
- **Demander plutôt que deviner** : si une valeur ou une règle manque dans les SPECS, l'IA doit poser la question au lieu d'inventer un comportement.
- **Un commit par étape** : chaque changement reste isolé et réversible.

## Exemple : la préparation du Rendu 1

1. **Audit en lecture seule** : Claude compare le code aux SPECS sans rien modifier et liste les écarts, les edge cases et les règles manquantes.
2. **Questions courtes** : quand le rapport est trop long pour y répondre d'un bloc, Claude me pose les questions par petits lots à choix multiples. Chaque réponse devient une règle écrite dans `RULES.md`.
3. **Corrections validées une à une** : test d'abord, puis correction, puis mise à jour de la SPEC concernée dans le même commit.
