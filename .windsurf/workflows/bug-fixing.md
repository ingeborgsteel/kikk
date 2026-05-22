---
description: Systematic approach to debugging and fixing issues in kikk
---

# Bug Fixing Workflow

This workflow provides a systematic approach to identifying, debugging, and fixing issues in the kikk codebase.

## 1. Issue Triage & Reproduction

1. **Understand the problem**
   - Read the issue description carefully
   - Identify expected vs actual behavior
   - Note any error messages or console logs

2. **Reproduce the bug**
   ```bash
   # Start development server
   npm run dev
   
   # Test in different environments:
   # - Desktop vs mobile viewport
   # - Light vs dark mode
   # - With vs without Supabase
   # - Different browsers if possible
   ```

3. **Gather information**
   - Check browser console for errors
   - Look at Network tab for failed requests
   - Verify localStorage contents
   - Check if issue is reproducible consistently

## 2. Root Cause Analysis

1. **Check the obvious first**
   - TypeScript compilation errors?
   - ESLint violations?
   - Missing imports or incorrect paths?

2. **Trace the data flow**
   ```
   User Action → Component → Context/Query → API → Storage
   ```
   - Where does the flow break?
   - Are there error states not being handled?
   - Is data being transformed incorrectly?

3. **Common failure points**
   - **Authentication**: `isSupabaseConfigured()` checks
   - **State Management**: Context vs TanStack Query usage
   - **API Integration**: Error handling, loading states
   - **Storage**: localStorage vs Supabase dual-mode
   - **Responsive Design**: Mobile viewport issues
   - **Theming**: Dark mode CSS classes

## 3. Debugging Tools & Techniques

### Browser DevTools

```javascript
// Check localStorage
console.log('Observations:', localStorage.getItem('kikk_observations'));
console.log('Theme:', localStorage.getItem('kikk_theme'));
console.log('Map Layer:', localStorage.getItem('kikk-map-layer'));

// Check Supabase configuration
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase configured:', isSupabaseConfigured());

// Check React state
// Add debugger statements or console.log in components
```

### TypeScript Debugging

```bash
# Check for type errors
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/react-app/your-file.tsx
```

### Network Debugging

- Check Network tab for failed API calls
- Verify API endpoints are correct
- Check for CORS issues
- Verify Supabase connection if applicable

## 4. Fix Implementation

1. **Apply minimal fix principle**
   - Fix the root cause, not symptoms
   - Prefer single-line changes when possible
   - Don't over-engineer solutions

2. **Follow existing patterns**
   - Use unified components (Modal, etc.)
   - Follow state management rules
   - Maintain code style consistency

3. **Add safety checks**
   ```typescript
   // Example: Defensive programming
   const data = localStorage.getItem('kikk_observations');
   const observations = data ? JSON.parse(data) : [];
   
   // Example: Error boundaries
   try {
     const result = await apiCall();
     return result;
   } catch (error) {
     console.error('Operation failed:', error);
     return fallbackValue;
   }
   ```

## 5. Testing the Fix

### Mandatory Test Checklist

- [ ] **Desktop viewport** - Test on larger screens
- [ ] **Mobile viewport** - Test on phone-sized screens
- [ ] **Light mode** - Default theme works correctly
- [ ] **Dark mode** - Toggle theme and verify styling
- [ ] **With Supabase** - Set env vars and test
- [ ] **Without Supabase** - Clear env vars and test fallback
- [ ] **Map interactions** - If map-related, test all interactions
- [ ] **Form validation** - Test form submission and validation
- [ ] **Data persistence** - Verify data saves/loads correctly
- [ ] **Page reload** - Test that state persists after refresh
- [ ] **Console errors** - Check browser console is clean
- [ ] **Backward compatibility** - Existing data still works

### Regression Testing

```bash
# Run full test suite
npm run lint      # Code quality
npm run build     # Production build
npm run check     # Complete validation
```

## 6. Common Bug Categories & Solutions

### State Management Issues

**Problem**: State not updating across components
```typescript
// Wrong: Direct state mutation
const [state, setState] = useState();
state.value = newValue; // Won't trigger re-render

// Correct: Immutable updates
setState(prev => ({ ...prev, value: newValue }));
```

**Problem**: Context not available
```typescript
// Add proper error handling in custom hook
export function useYourContext() {
  const context = useContext(YourContext);
  if (!context) {
    throw new Error('useYourContext must be used within YourProvider');
  }
  return context;
}
```

### API Integration Issues

**Problem**: API calls failing silently
```typescript
// Add proper error handling
export async function yourApiFunction(params: YourParams): Promise<YourResult> {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw new Error('Failed to complete operation. Please try again.');
  }
}
```

### Storage Issues

**Problem**: localStorage data corruption
```typescript
// Add validation and fallbacks
export function loadObservations(): Observation[] {
  try {
    const data = localStorage.getItem('kikk_observations');
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load observations:', error);
    return [];
  }
}
```

### Responsive Design Issues

**Problem**: Mobile layout broken
```css
/* Use responsive Tailwind classes */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Content -->
</div>
```

### Dark Mode Issues

**Problem**: Dark mode styling missing
```tsx
// Always include dark variants
<button className="bg-forest text-white dark:bg-bark dark:text-sand">
  Button
</button>
```

## 7. Documentation & Follow-up

1. **Update documentation if needed**
   - ARCHITECTURE.md for architectural changes
   - Component documentation for new patterns
   - Add comments explaining complex fixes

2. **Add regression tests**
   - Document the specific test case that caught this bug
   - Add to the testing checklist if it's a common area

3. **Create follow-up issues if needed**
   - Separate larger fixes into smaller issues
   - Document technical debt discovered during debugging

## 8. Prevention Strategies

1. **Code review checklist**
   - TypeScript strictness
   - Error handling completeness
   - Responsive design verification
   - Dark mode support
   - Dual-mode operation testing

2. **Development practices**
   - Test frequently during development
   - Use TypeScript strictly
   - Follow established patterns
   - Add defensive programming

3. **Automated checks**
   - ESLint for code quality
   - TypeScript compilation
   - Build process validation

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Check code quality
npm run format           # Format code
npm run check            # Full validation

# Debugging
npx tsc --noEmit         # Check TypeScript errors
npx eslint file.tsx      # Check specific file
localStorage.clear()     # Clear all local storage
```

Remember: Most bugs in kikk are related to dual-mode operation (Supabase vs localStorage), responsive design, or state management. Always test these areas thoroughly!
