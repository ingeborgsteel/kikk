---
name: feature-retrospective
description: Reflect on a completed feature to identify missing or outdated skills, instructions, and patterns
---

# Feature Retrospective

Run this skill at the end of a feature, after the implementation and tests are complete but before the final PR/push. It captures friction, missing guidance, and instruction drift so the next feature is smoother.

## When to run

- After the feature checklist in `.devin/skills/feature-development/SKILL.md` is complete.
- Before `pre-pr-validation` and the final PR/push.
- Whenever you found yourself looking up the same thing twice, working around an instruction, or ignoring a skill because it was outdated.

## How to run

1. Review the work that was done:
   - `git diff --name-only main...HEAD` or `git status --short`
   - The feature branch's commits (`git log --oneline main..HEAD`)
   - Any temporary workarounds or hacks you used
2. Ask yourself the retrospective questions below.
3. If an answer points to a gap in `AGENTS.md`, `ARCHITECTURE.md`, a `.devin/skills/*` file, or `.github/copilot-instructions.md`, update the relevant instruction file before finalizing the PR.
4. Run `pre-pr-validation` after any instruction updates.

## Retrospective questions

1. **Was any skill or instruction file unhelpful or wrong?**
   - Did a skill tell you to do something that no longer works?
   - Did you have to ignore or override a skill step?
   - Was an example in the skill out of date?
2. **Was any guidance missing?**
   - Did you have to figure out a pattern from scratch that should be documented?
   - Was there a new domain concept, type, API, or env var that `AGENTS.md` or `ARCHITECTURE.md` should mention?
   - Did you add a new UI primitive, map behavior, auth edge case, or offline path that should be in a skill?
3. **Did the feature touch something that should update the pre-pr-validation skill?**
   - New source-of-truth files (e.g., new env var, new worker route, new external API)?
   - New instruction-worthiness categories (e.g., a new directory or convention)?
4. **Was tooling or project hygiene unclear?**
   - Commands, scripts, or formatting that tripped you up?
   - Branch, test, or deployment workflow that needs documenting?
5. **Could the feature-development skill be smoother?**
   - Should a new step, example, or troubleshooting item be added?
   - Should a section be reordered or split?

## Common updates to make

| Gap | Likely place to update |
|---|---|
| Missing or changed pattern | `AGENTS.md` or `ARCHITECTURE.md` |
| Outdated step in a workflow | Relevant `.devin/skills/*/SKILL.md` |
| New env var, dependency, or build step | `AGENTS.md` and `.devin/skills/deployment/SKILL.md` |
| New auth / guest mode edge case | `AGENTS.md` Dual-Mode Operation and `.devin/skills/bug-fixing/SKILL.md` |
| New UI primitive or component pattern | `AGENTS.md` UI Components / shadcn pattern |
| New map / offline behavior | `AGENTS.md` PWA & Offline Features and `.devin/skills/feature-development/SKILL.md` |
| New validation or doc-ownership category | `.devin/skills/pre-pr-validation/SKILL.md` |

## Agent rule

Before marking a feature complete, run the `feature-retrospective` skill. If it reveals a gap in the project's instructions or skills, update the relevant doc or skill before finalizing the PR. The PR should leave the instruction set better than it was, not leave the next agent to rediscover the same friction.
