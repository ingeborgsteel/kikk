---
name: deployment
description: Deployment workflow for kikk to Cloudflare Workers
---

# Deployment Workflow

This workflow covers the complete process for deploying kikk to Cloudflare Workers, including build, testing, and monitoring.

## 1. Pre-Deployment Checklist

### Code Quality

```bash
# Run all checks locally first
npm run lint      # Must pass with no errors
npm run build     # Must succeed without warnings
npm run check     # Full validation including TypeScript
npm run format    # Ensure consistent formatting
```

**Checklist:**

- [ ] All ESLint rules pass
- [ ] TypeScript compilation succeeds
- [ ] Production build completes successfully
- [ ] Code is properly formatted
- [ ] No console.error statements in production code
- [ ] Environment variables properly configured

### Environment Configuration

```bash
# Verify environment variables
# .env file (gitignored)
VITE_BETTER_AUTH_BASE_URL=http://localhost:5173
VITE_GITHUB_TOKEN=your_github_token
VITE_ENABLE_CLOUDFLARE_LOGGING=false

# For branch previews / local previews that need the hidden guest bypass
# VITE_FORCE_LOGIN=false
```

**Checklist:**

- [ ] Required environment variables documented
- [ ] Sensitive values not hardcoded
- [ ] `.env.example` updated if new variables added
- [ ] wrangler.json configuration is correct

## 2. Build Process

### Production Build

```bash
# Build for production
npm run build

# Verify build output
ls -la dist/
```

**Build outputs:**

- `dist/` - Production-ready assets
- Client-side React app
- Worker bundle for Cloudflare
- Static assets (images, icons)

### Build Verification

```bash
# Preview production build locally
npm run preview

# Test the preview build at http://localhost:4173
```

**Checklist:**

- [ ] Build completes without errors
- [ ] All assets are generated correctly
- [ ] Preview build works locally
- [ ] No missing assets or 404 errors
- [ ] PWA manifest is correctly generated

## 3. Cloudflare Workers Configuration

### wrangler.json Setup

```json
{
  "name": "kikk",
  "main": "./src/api/index.ts",
  "compatibility_date": "2025-10-08",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "logs": { "enabled": true, "invocation_logs": true },
    "traces": { "enabled": false }
  },
  "upload_source_maps": true,
  "assets": {
    "directory": "./dist/client",
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "kikk-db",
      "database_id": "8be1edcf-1c04-43e9-8e5e-3ef59eed5967",
      "preview_database_id": "afcde3ed-721b-4d0b-b33d-67b7eb01b0f6",
      "migrations_dir": "migrations"
    }
  ]
}
```

**Checklist:**

- [ ] Worker entry point is correct
- [ ] Assets directory points to `./dist/client`
- [ ] Compatibility flags are appropriate
- [ ] Environment variables configured in Cloudflare dashboard

### Worker Code Review

```typescript
// src/api/index.ts should include:
✅ Hono app setup
✅ Static asset serving
✅ Health check endpoint
✅ Error handling
✅ CORS headers if needed
```

## 4. Deployment Process

### Deploy to Cloudflare

```bash
# Deploy to Cloudflare Workers
npm run deploy

# Or using wrangler directly
npx wrangler deploy
```

**Deployment outputs:**

- Worker URL (e.g., https://kikk.your-subdomain.workers.dev)
- Deployment status
- Any warnings or errors

### Deployment Verification

```bash
# Test the deployed application
curl https://kikk.your-subdomain.workers.dev

# Check worker logs
npx wrangler tail
```

**Checklist:**

- [ ] Deployment succeeds without errors
- [ ] Application loads correctly at worker URL
- [ ] All pages and routes work
- [ ] Static assets load correctly
- [ ] API endpoints respond properly

## 5. Post-Deployment Testing

### Functional Testing

1. **Map Functionality**
   - Map loads and displays tiles
   - Click-to-select location works
   - Layer switching functions correctly
   - Markers display properly

2. **Observation Management**
   - Create new observations
   - Edit existing observations
   - Delete observations
   - Export to Excel functionality

3. **Authentication**
   - Better Auth sign-in / sign-up / sign-out works
   - Hidden guest bypass works when `VITE_FORCE_LOGIN=false`
   - User session persists
   - Protected routes work correctly

4. **Responsive Design**
   - Mobile viewport works
   - Desktop layout correct
   - Touch interactions work

5. **Offline Functionality**
   - PWA installs correctly
   - Offline mode works
   - Tile caching functions

### Cross-Browser Testing

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## 6. Monitoring & Maintenance

### Log Monitoring

```bash
# Monitor worker logs in real-time
npx wrangler tail

# Check specific log levels
npx wrangler tail --format=json
```

### Performance Monitoring

- [ ] Page load times
- [ ] API response times
- [ ] Error rates
- [ ] Worker CPU usage

### Analytics Setup

- [ ] Cloudflare Analytics configured
- [ ] Custom events tracked if needed
- [ ] Error monitoring setup

## 7. Rollback Procedures

### Emergency Rollback

```bash
# Rollback to previous deployment
npx wrangler rollback

# Or deploy previous version
git checkout previous-commit-tag
npm run build
npm run deploy
```

### Rollback Triggers

- Critical bugs affecting core functionality
- Security vulnerabilities
- Performance degradation
- Data corruption issues

## 8. Environment Management

### Development vs Production

```bash
# Development
npm run dev              # Local development
VITE_BETTER_AUTH_BASE_URL=http://localhost:5173

# Production
npm run build && npm run deploy
VITE_BETTER_AUTH_BASE_URL=https://your-production-domain.com
```

### Environment-Specific Configurations

- [ ] Development: Local Hono dev server, hot reload
- [ ] Staging: Production-like environment
- [ ] Production: Live configuration

## 9. Security Considerations

### Security Checklist

- [ ] No sensitive data in client bundle
- [ ] Environment variables properly configured
- [ ] CORS policies configured correctly
- [ ] Authentication tokens handled securely
- [ ] API rate limiting if needed

### Security Headers

```typescript
// Add security headers in worker if needed
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
});
```

## 10. Troubleshooting Common Issues

### Build Issues

```bash
# TypeScript errors
npx tsc --noEmit

# Missing dependencies
npm install

# Clear build cache
rm -rf dist/ node_modules/.vite
npm run build
```

### Deployment Issues

```bash
# Check wrangler configuration
npx wrangler whoami
npx wrangler kv:namespace list

# Debug worker
npx wrangler dev
```

### Runtime Issues

```bash
# Check worker logs
npx wrangler tail

# Test specific endpoints
curl https://your-worker.workers.dev/api/health
```

## 11. Performance Optimization

### Build Optimization

- [ ] Bundle size analysis completed
- [ ] Unused code eliminated
- [ ] Assets properly compressed
- [ ] Caching headers configured

### Runtime Optimization

- [ ] Database queries optimized
- [ ] API response times minimized
- [ ] CDN caching configured
- [ ] Worker memory usage optimized

## 12. Documentation Updates

### Post-Deployment Documentation

- [ ] README.md updated with deployment URL
- [ ] Architecture.md updated if changes made
- [ ] Deployment notes documented
- [ ] Troubleshooting guide updated

### Version Management

```bash
# Tag releases for easy rollback
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Quick Deployment Commands

```bash
# Complete deployment process
npm run lint && npm run build && npm run deploy

# Deploy with monitoring
npm run deploy && npx wrangler tail

# Emergency rollback
npx wrangler rollback
```

## Deployment Checklist Summary

**Before Deployment:**

- [ ] Code quality checks pass
- [ ] Build succeeds locally
- [ ] Environment variables configured
- [ ] Local testing completed

**During Deployment:**

- [ ] Build completes successfully
- [ ] Deployment succeeds
- [ ] Worker URL accessible

**After Deployment:**

- [ ] Functional testing completed
- [ ] Cross-browser testing done
- [ ] Performance verified
- [ ] Documentation updated

Remember: Always test thoroughly in a staging environment before deploying to production!
