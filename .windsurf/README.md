# Windsurf Agent Configuration for kikk

This directory contains configuration files and workflows to optimize Windsurf agent coding for the kikk project.

## Files Overview

### Core Documentation
- **`project-guide.md`** - Comprehensive guide for Windsurf agents working on kikk
- **`README.md`** - This file, overview of available configurations

### Workflows (Slash Commands)
- **`/feature-development`** - Step-by-step guide for adding new features
- **`/bug-fixing`** - Systematic approach to debugging and fixing issues
- **`/code-review`** - Guidelines for reviewing pull requests
- **`/deployment`** - Complete deployment workflow to Cloudflare Workers

## How to Use

### For Windsurf Agents
When working on kikk, start by reading the `project-guide.md` to understand:
- Project architecture and patterns
- Technology stack and conventions
- Critical rules and requirements
- Common pitfalls to avoid

### For Developers
Use the slash commands in your IDE:
- Type `/feature-development` to get guidance on adding features
- Type `/bug-fixing` for systematic debugging approaches
- Type `/code-review` for PR review guidelines
- Type `/deployment` for deployment procedures

## Key Project Characteristics

### Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Hono on Cloudflare Workers
- **State Management**: React Context + TanStack Query
- **Styling**: Tailwind CSS with custom design tokens
- **Maps**: Leaflet with offline PWA support

### Critical Requirements
1. **Dual-mode operation** - Must work with AND without Supabase
2. **Responsive design** - Mobile-first approach
3. **Dark mode support** - Complete theme coverage
4. **Offline functionality** - PWA with tile caching
5. **TypeScript strictness** - No `any` types allowed

### Unified Components
- **Modal** - Use for all dialogs/pop-ups
- **Map components** - Map.tsx and LocationEditor with shared preferences
- **Marker Icons** - Centralized icon system in `lib/markerIcons.ts`

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Code quality check
npm run format       # Code formatting
npm run check        # Full validation
npm run deploy       # Deploy to Cloudflare Workers
```

## Testing Requirements

Always verify:
- [ ] Desktop and mobile viewports
- [ ] Light and dark mode
- [ ] With and without Supabase
- [ ] Map interactions
- [ ] Form submissions
- [ ] Data persistence
- [ ] Offline functionality

## Common Patterns

### State Management Decision Tree
- **Context** → Shared domain state, dual-mode storage
- **TanStack Query** → Server data with caching
- **Component State** → Ephemeral UI state

### File Organization
- `components/ui/` → Reusable UI primitives
- `components/` → Feature components
- `api/` → Plain async functions (no React)
- `queries/` → TanStack Query hooks
- `context/` → React Context providers
- `types/` → TypeScript interfaces
- `lib/` → Pure utilities

### Error Handling
- Always handle API errors gracefully
- Show user-friendly error messages
- Implement loading states
- Use defensive programming for localStorage

## Getting Started

1. **Read the project guide** - `project-guide.md`
2. **Set up development environment** - Follow README.md in project root
3. **Choose appropriate workflow** - Use slash commands for guidance
4. **Follow testing requirements** - Verify all checklist items
5. **Maintain code quality** - Use ESLint and TypeScript strictly

## Support

For questions about:
- **Project architecture** → Check `project-guide.md`
- **Feature development** → Use `/feature-development`
- **Bug fixes** → Use `/bug-fixing`
- **Code reviews** → Use `/code-review`
- **Deployment** → Use `/deployment`

Remember: kikk must work seamlessly whether Supabase is configured or not. Always test both modes!
