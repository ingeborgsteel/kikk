# Windsurf Agent Configuration for kikk

This directory contains configuration files and workflows to optimize Windsurf agent coding for the kikk project. The canonical, framework-agnostic project instructions live in [`AGENTS.md`](../AGENTS.md) at the repo root — read that first.

## Files Overview

### Core Documentation

- **`../AGENTS.md`** - Canonical project instructions (tech stack, architecture, code style, testing, PR guidelines)
- **`project-guide.md`** - Windsurf-specific pointer to `AGENTS.md` plus available reusable workflows
- **`README.md`** - This file, overview of available configurations

### Reusable Workflows

The project-level workflows live in [`../.devin/skills/`](../.devin/skills). They are framework-agnostic and can be read by any agent:

- `feature-development/SKILL.md` - Step-by-step guide for adding new features
- `bug-fixing/SKILL.md` - Systematic approach to debugging and fixing issues
- `code-review/SKILL.md` - Guidelines for reviewing pull requests
- `deployment/SKILL.md` - Complete deployment workflow to Cloudflare Workers

## How to Use

### For Windsurf Agents

When working on kikk, start by reading [`AGENTS.md`](../AGENTS.md) to understand project architecture, conventions, critical rules, and common pitfalls. Then check the relevant workflow in [`../.devin/skills/`](../.devin/skills) for the task at hand.

## Getting Started

1. **Read `AGENTS.md`** at the repo root for full project instructions
2. **Set up development environment** - Follow README.md in project root
3. **Choose appropriate workflow** - See the relevant workflow file in `.devin/skills/` for guidance
4. **Follow testing requirements** - see the Testing Approach section in `AGENTS.md`

## Support

For questions about:

- **Project architecture** → Check [`AGENTS.md`](../AGENTS.md)
- **Feature development** → See [`.devin/skills/feature-development/SKILL.md`](../.devin/skills/feature-development/SKILL.md)
- **Bug fixes** → See [`.devin/skills/bug-fixing/SKILL.md`](../.devin/skills/bug-fixing/SKILL.md)
- **Code reviews** → See [`.devin/skills/code-review/SKILL.md`](../.devin/skills/code-review/SKILL.md)
- **Deployment** → See [`.devin/skills/deployment/SKILL.md`](../.devin/skills/deployment/SKILL.md)
