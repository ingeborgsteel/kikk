---
description: Comprehensive code review guidelines for kikk pull requests
---

# Code Review Workflow

This workflow provides guidelines for reviewing pull requests in the kikk codebase to ensure code quality, consistency, and maintainability.

## 1. Initial Review Checklist

### PR Quality
- [ ] PR title matches or closely follows the issue title
- [ ] PR description references related issues (e.g., "Closes #42")
- [ ] Summary of changes is clear and concise
- [ ] PR is focused on a single logical change
- [ ] Screenshots included for UI changes

### Automated Checks
- [ ] All CI checks pass (ESLint, TypeScript, build)
- [ ] Code is properly formatted (`npm run format`)
- [ ] No merge conflicts

## 2. Code Quality Review

### TypeScript Compliance
```typescript
// Look for these issues:
❌ const data: any = response.data;
✅ const data: SpecificType = response.data;

❌ function processData(data) { ... }
✅ function processData(data: DataType): ProcessedType { ... }
```

**Checklist:**
- [ ] No `any` types used
- [ ] Proper interfaces defined in `types/` directory
- [ ] Function return types specified
- [ ] Generic types used appropriately
- [ ] Strict TypeScript compilation passes

### React Patterns
```typescript
// Correct patterns:
✅ Functional components with hooks
✅ React Hook Form for all forms
✅ Custom hooks for complex logic
✅ Single responsibility principle

❌ Class components
❌ Direct state mutation
❌ Inline styles
```

**Checklist:**
- [ ] Functional components only
- [ ] React Hook Form used for forms
- [ ] Proper hook usage (no rules violations)
- [ ] Components are focused and single-purpose
- [ ] Props are properly typed

## 3. Architecture & Patterns Review

### State Management
```typescript
// Correct usage:
✅ Context for shared domain state
✅ TanStack Query for server data
✅ Component state for UI-only data

❌ Server state in Context
❌ UI state in TanStack Query
```

**Checklist:**
- [ ] State management follows decision tree
- [ ] Context providers have proper error boundaries
- [ ] Custom hooks throw errors when used outside providers
- [ ] TanStack Query used for API calls with caching
- [ ] No mixing of state management patterns

### Directory Structure
```
src/react-app/
├── components/          # Feature components
│   └── ui/             # UI primitives only
├── context/            # Context providers
├── queries/            # TanStack Query hooks
├── api/                # Plain async functions
├── types/              # TypeScript interfaces
└── lib/                # Pure utilities
```

**Checklist:**
- [ ] Files placed in correct directories
- [ ] `api/` files have no React imports
- [ ] `queries/` files wrap `api/` functions
- [ ] UI primitives in `components/ui/`
- [ ] Types defined in `types/` directory

## 4. Unified Components Compliance

### Modal Component
```typescript
// Always use the unified Modal:
✅ <Modal title="Title" maxWidth="md">
✅ Consistent header structure
✅ ESC key closes automatically
✅ Click outside closes

❌ Custom modal implementations
❌ Inconsistent styling
```

**Checklist:**
- [ ] Unified Modal component used for all dialogs
- [ ] Proper title and maxWidth props
- [ ] Consistent styling with existing modals

### Map Components
```typescript
// Correct usage:
✅ Map.tsx for full-page maps
✅ LocationEditor for embedded maps
✅ Shared layer preferences
✅ Consistent marker icons

❌ Custom map implementations
❌ Hardcoded map configurations
```

**Checklist:**
- [ ] Appropriate map component used
- [ ] Layer preferences shared via Context
- [ ] Marker icons from `lib/markerIcons.ts`
- [ ] Map interactions follow existing patterns

## 5. Styling & Responsive Design

### Tailwind CSS Compliance
```typescript
// Correct patterns:
✅ Tailwind utility classes only
✅ Custom design tokens (forest, sand, bark)
✅ Mobile-first responsive design
✅ Dark mode variants included

❌ Inline styles
❌ Custom CSS files
❌ Hardcoded colors
```

**Checklist:**
- [ ] Only Tailwind classes used
- [ ] Custom design tokens used consistently
- [ ] Mobile-first responsive breakpoints
- [ ] Dark mode variants (`dark:`) included
- [ ] No inline styles or CSS files

### Responsive Design
```typescript
// Check these breakpoints:
✅ sm: 640px+ (small tablets)
✅ md: 768px+ (tablets)
✅ lg: 1024px+ (desktop)
✅ xl: 1280px+ (large desktop)
```

**Checklist:**
- [ ] Layout works on mobile (default)
- [ ] Responsive breakpoints used appropriately
- [ ] No horizontal scroll on mobile
- [ ] Touch targets are appropriately sized

## 6. Dual-Mode Operation Review

### Supabase Integration
```typescript
// Always check configuration:
✅ if (isSupabaseConfigured()) { ... }
✅ Graceful fallback to localStorage
✅ No hard dependencies on Supabase

❌ Direct Supabase calls without checks
❌ Breaking functionality without Supabase
```

**Checklist:**
- [ ] `isSupabaseConfigured()` checks present
- [ ] localStorage fallbacks implemented
- [ ] App works without environment variables
- [ ] No Supabase-specific UI without configuration

### Data Persistence
```typescript
// localStorage keys:
✅ kikk_observations
✅ kikk_user_locations
✅ kikk_theme
✅ kikk-map-layer
```

**Checklist:**
- [ ] Correct localStorage keys used
- [ ] Data properly serialized/deserialized
- [ ] Error handling for corrupted data
- [ ] Backward compatibility maintained

## 7. Error Handling & Edge Cases

### API Error Handling
```typescript
// Proper pattern:
✅ try/catch blocks with user-friendly messages
✅ Loading states implemented
✅ Graceful degradation

❌ Silent failures
❌ Unhandled promise rejections
```

**Checklist:**
- [ ] API calls have proper error handling
- [ ] User-friendly error messages
- [ ] Loading states for async operations
- [ ] Graceful fallbacks for failures

### Form Validation
```typescript
// React Hook Form patterns:
✅ Proper validation rules
✅ Error state display
✅ Accessible error messages

❌ Unvalidated form submissions
```

**Checklist:**
- [ ] Forms use React Hook Form validation
- [ ] Error messages are user-friendly
- [ ] Validation is comprehensive
- [ ] Form submission is properly handled

## 8. Performance & Security

### Performance
- [ ] No unnecessary re-renders
- [ ] Proper memoization where needed
- [ ] Efficient data fetching
- [ ] No memory leaks in useEffect

### Security
- [ ] No sensitive data in localStorage
- [ ] Proper authentication checks
- [ ] Input validation and sanitization
- [ ] No hardcoded credentials

## 9. Testing Requirements

### Manual Testing Verification
- [ ] Desktop viewport tested
- [ ] Mobile viewport tested
- [ ] Light mode tested
- [ ] Dark mode tested
- [ ] With Supabase tested
- [ ] Without Supabase tested
- [ ] Map interactions tested (if applicable)
- [ ] Form submissions tested
- [ ] Data persistence tested
- [ ] Page reload tested

### Regression Testing
- [ ] Existing functionality still works
- [ ] No breaking changes to APIs
- [ ] Backward compatibility maintained
- [ ] Performance not degraded

## 10. Documentation Review

### Code Documentation
- [ ] Complex functions have JSDoc comments
- [ ] Component props are documented
- [ ] Business logic is explained
- [ ] API endpoints are documented

### README/Architecture Updates
- [ ] README updated for user-facing features
- [ ] ARCHITECTURE.md updated for structural changes
- [ ] New patterns documented
- [ ] Migration guides provided if needed

## 11. Review Feedback Template

### Positive Feedback
```markdown
👍 **Good practices observed:**
- Proper TypeScript typing throughout
- Consistent use of unified components
- Comprehensive error handling
- Responsive design implemented correctly
```

### Issues to Address
```markdown
🔧 **Required changes:**
- Replace `any` types with proper interfaces
- Add dark mode variants to Tailwind classes
- Include `isSupabaseConfigured()` check
- Add loading state for API call
```

### Suggestions
```markdown
💡 **Suggestions for improvement:**
- Consider extracting this logic to a custom hook
- Could benefit from memoization for performance
- Add unit tests for this utility function
```

## 12. Approval Criteria

A PR can be approved when:

1. ✅ All automated checks pass
2. ✅ Code quality standards met
3. ✅ Architecture patterns followed
4. ✅ Unified components used correctly
5. ✅ Responsive and dark mode compatible
6. ✅ Dual-mode operation verified
7. ✅ Error handling comprehensive
8. ✅ Testing requirements satisfied
9. ✅ Documentation updated
10. ✅ No regressions introduced

## Quick Review Commands

```bash
# Review locally before submitting
npm run lint      # Check code quality
npm run build     # Verify build succeeds
npm run format    # Check formatting
npm run check     # Full validation

# TypeScript checking
npx tsc --noEmit  # Verify types

# Test different modes
# With Supabase
VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=yyy npm run dev

# Without Supabase
npm run dev
```

Remember: The goal is to maintain code quality while enabling rapid development. Focus on blocking issues and provide constructive feedback for improvements.
