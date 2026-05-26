---
description: Step-by-step guide for adding new features to kikk
---

# Feature Development Workflow

This workflow guides you through adding a new feature to kikk while maintaining code quality and architectural consistency.

## 1. Planning & Requirements

1. **Ask clarifying questions first**
   - When requirements are ambiguous or incomplete, ask the user before making assumptions
   - Examples: "Should the coordinates be shortened to 2 or 4 decimals?", "What color should the badge be?"
   - Better to wait for clarification than to guess and rework

2. **Define the feature scope**
   - What user problem are you solving?
   - What are the acceptance criteria?
   - Does it require authentication or should it work offline?

3. **Identify data requirements**
   - What data needs to be stored?
   - Does it need server-side storage or is local storage sufficient?
   - What external APIs are needed?

4. **Create/Update types**
   ```typescript
   // src/react-app/types/your-feature.ts
   export interface YourFeatureType {
     id: string;
     // ... other properties
   }
   ```

## 2. API Layer Development

1. **Create API client functions** (if external services needed)

   ```typescript
   // src/react-app/api/your-feature.ts
   export async function createYourFeature(
     data: YourFeatureType,
   ): Promise<YourFeatureType> {
     // API call logic - NO React imports
   }
   ```

2. **Add TanStack Query hooks**
   ```typescript
   // src/react-app/queries/your-feature.ts
   export function useCreateYourFeature() {
     return useMutation({
       mutationFn: createYourFeature,
       onSuccess: () => {
         // Invalidate related queries
       },
     });
   }
   ```

## 3. State Management

1. **Determine storage strategy**
   - Use Context if state is shared across components
   - Use TanStack Query for server-fetched data
   - Use component state for UI-only data

2. **Create Context provider** (if needed)

   ```typescript
   // src/react-app/context/YourFeatureContext.tsx
   export const YourFeatureProvider: React.FC<{
     children: React.ReactNode;
   }> = ({ children }) => {
     // Context logic with dual-mode storage support
   };

   export function useYourFeature() {
     const context = useContext(YourFeatureContext);
     if (!context)
       throw new Error(
         "useYourFeature must be used within YourFeatureProvider",
       );
     return context;
   }
   ```

3. **Add to provider hierarchy** in `src/react-app/main.tsx`

## 4. UI Development

1. **Create feature components**
   - Use unified Modal component for all dialogs
   - Follow existing component patterns
   - Use React Hook Form for all forms

2. **Reuse UI primitives**
   - Check `components/ui/` for existing components
   - Don't recreate Button, Input, Modal, etc.

3. **Implement responsive design**
   - Mobile-first approach
   - Test on both desktop and mobile viewports

4. **Check for overlaying UI from parent components**
   - When adding UI to a component (e.g. Map), check parent components (e.g. App.tsx) for absolute-positioned elements that might overlap
   - Verify z-index layering and positioning (top-left, bottom-right, etc.)
   - Test that your new UI doesn't get hidden by existing overlays

## 5. Worktree Setup (if working in a git worktree)

When developing in a git worktree (e.g. `git worktree add ../kikk-my-feature -b feature/my-feature`), the `.env` file is not copied automatically since it is gitignored. Symlink it from the main worktree before running `npm run dev`:

```bash
ln -s /Users/ingeborgsteel/dev/kikk/.env /Users/ingeborgsteel/dev/kikk-my-feature/.env
npm install
npm run dev
```

## 6. Integration & Testing

1. **Integrate with routing**
   - Add routes in `App.tsx` if needed
   - Update navigation components

2. **Test dual-mode operation**

   ```bash
   # Test without Supabase
   unset VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY
   npm run dev

   # Test with Supabase
   # Set environment variables and test again
   ```

3. **Verify all requirements**
   - [ ] Desktop and mobile viewports work
   - [ ] Light and dark mode work
   - [ ] Map interactions (if applicable)
   - [ ] Form validation and submission
   - [ ] Data persistence (localStorage/Supabase)
   - [ ] Offline functionality
   - [ ] Backward compatibility

## 6. Code Quality Checks

```bash
# Run all checks before submitting
npm run lint      # Must pass
npm run build     # Must succeed
npm run check     # Full validation
npm run format    # Ensure consistent formatting
```

## 7. Documentation

1. **Update relevant documentation**
   - README.md (if user-facing feature)
   - ARCHITECTURE.md (if architectural changes)
   - Component documentation (JSDoc comments)

2. **Create PR with clear description**
   - Reference related issues
   - Include testing steps
   - Add screenshots for UI changes

## Common Patterns to Follow

### Form Pattern

```typescript
// Always use React Hook Form
const { control, handleSubmit, formState: { errors } } = useForm<YourFormType>();

// Use Controller for custom components
<Controller
  name="fieldName"
  control={control}
  render={({ field }) => (
    <YourUIComponent {...field} error={errors.fieldName?.message} />
  )}
/>
```

### API Error Handling Pattern

```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error("API call failed:", error);
  throw new Error("User-friendly error message");
}
```

### Dual-Mode Storage Pattern

```typescript
const saveData = async (data: YourType) => {
  if (isSupabaseConfigured()) {
    // Use Supabase
    return await saveToSupabase(data);
  } else {
    // Use localStorage
    localStorage.setItem("kikk_your_feature", JSON.stringify(data));
    return data;
  }
};
```

## Feature Checklist

Before considering a feature complete:

- [ ] TypeScript compilation succeeds
- [ ] ESLint passes with no errors
- [ ] All components use proper typing
- [ ] Responsive design works on mobile
- [ ] Dark mode styling implemented
- [ ] Forms use React Hook Form
- [ ] Unified components used (Modal, etc.)
- [ ] Dual-mode operation tested
- [ ] Error states handled gracefully
- [ ] Loading states implemented
- [ ] Data persistence verified
- [ ] Backward compatibility maintained
- [ ] Documentation updated

## Troubleshooting

### Common Issues

1. **TypeScript errors**: Check types in `types/` directory
2. **Build failures**: Verify all imports are correct
3. **Responsive issues**: Check Tailwind breakpoints
4. **Dark mode problems**: Ensure `dark:` variants are used
5. **localStorage issues**: Verify dual-mode logic
6. **Map problems**: Check marker icon usage

### Debug Commands

```bash
# Check TypeScript compilation
tsc --noEmit

# Check build output
npm run build

# Lint specific file
npx eslint src/react-app/your-file.tsx

# Format code
npm run format
```

Remember: Always test both with and without Supabase configured to ensure the app works in all scenarios!
