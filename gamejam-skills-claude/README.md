# Skills GAMEJAM — premier rendu

Dix skills Claude Code pour accompagner la phase de conception et de construction du premier rendu (thème "clickbait"), à exécuter dans cet ordre :

1. `/brainstormer` → `brainstorm.md`
2. `/challenger` → `idee-retenue.md`
3. `/specifier` → `SPECS/CONCEPT.md` + `SPECS/RULES.md`
4. `/art-director` → `SPECS/GRAPHICS.md` (+ images dans `SPECS/assets/`)
5. `/tech-advisor` → `SPECS/TECHNICAL.md`
6. `/roadmapper` → `SPECS/ROADMAP.md`
7. `/poc-designer` → `SPECS/POC-SPECS.md`
8. `/pre-rendu-check` → `PRE-RENDU-CHECK.md`
9. `/asset-generator` → `SPECS/POC-ASSETS.md`
10. `/poc-generator` → le POC codé et jouable

Chaque skill vérifie que le(s) fichier(s) produit(s) par le skill précédent existent, et refuse de démarrer sinon. Tous les skills interagissent en posant une seule question à la fois.

Plus trois skills hors chaîne, utilisables à tout moment :

- `/workflow-designer` (dès que `SPECS/ROADMAP.md` existe) — définit la méthode de travail avec un agent IA pour construire le MVP, indépendamment de l'avancement du POC. Produit `SPECS/AGENTIC-WORKFLOW.md`, un des livrables attendus au rendu 1 : il doit exister avant `/pre-rendu-check`, mais peut être produit à n'importe quel moment de la chaîne.
- `/enricher <idée>` (dès que `CONCEPT.md`/`RULES.md` existent) — intègre une nouvelle idée dans le jeu déjà conçu (affine l'idée, met à jour `CONCEPT.md`/`RULES.md`/`ROADMAP.md` et, si besoin, `GRAPHICS.md`/`TECHNICAL.md`, vérifie que `RULES.md` couvre bien l'ajout).
- `/spec-reviewer` (dès que `CONCEPT.md`/`RULES.md` existent) — relit tous les fichiers de `SPECS/` ensemble, traque les incohérences entre fichiers et les trous dans les règles qui pourraient pousser un agent IA à inventer une règle au moment du développement. Utile après plusieurs `/enricher`, ou avant une grosse session de développement du MVP.

## Installation dans votre projet

1. Copiez `COURS-BRIEF.md` à la racine de votre projet. Il donne aux skills le contexte du cours (thème, attentes exactes du rendu 1, critères d'évaluation) — sans lui, tous les skills refusent de démarrer.

2. Copiez le contenu de ce dossier (les 13 sous-dossiers de skills, sans ce README ni `COURS-BRIEF.md`) dans `.claude/skills/` à la racine de votre projet :

```
votre-projet/
  COURS-BRIEF.md
  .claude/
    skills/
      brainstormer/SKILL.md
      challenger/SKILL.md
      specifier/SKILL.md
      art-director/SKILL.md
      tech-advisor/SKILL.md
      roadmapper/SKILL.md
      poc-designer/SKILL.md
      workflow-designer/SKILL.md
      pre-rendu-check/SKILL.md
      asset-generator/SKILL.md
      poc-generator/SKILL.md
      enricher/SKILL.md
      spec-reviewer/SKILL.md
```

Les fichiers de travail intermédiaires (`brainstorm.md`, `idee-retenue.md`) et le fichier de fin de conception (`PRE-RENDU-CHECK.md`) sont écrits à la racine du projet. Les livrables du rendu 1 sont écrits dans `SPECS/` (les six fichiers officiels du cours, plus `POC-SPECS.md` et `POC-ASSETS.md`, propres à ce parcours). La dernière étape (`/poc-generator`) ne produit pas un fichier markdown : elle construit le POC lui-même.
