# Deployment Guide - Login Failure Analyzer

## Quick Start (Local Testing)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Access the analyzer:**
   - App: http://localhost:3000
   - Login: http://localhost:3000/login
   - Dashboard: http://localhost:3000/admin/login-failures

4. **Test failure capture:**
   - Try logging in with any username
   - If login fails, check the dashboard
   - Failures are automatically captured and stored

## Production Deployment

### Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Or connect via Vercel Dashboard:**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Select the branch to deploy
   - Vercel auto-detects Next.js configuration
   - Click "Deploy"

4. **Access:**
   - Production: `https://your-app.vercel.app`
   - Dashboard: `https://your-app.vercel.app/admin/login-failures`

### Netlify

1. **Create `netlify.toml`:**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Deploy:**
   - Go to https://netlify.com
   - Import GitHub repository
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Click "Deploy site"

### Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

### Environment Variables

If your app uses environment variables, configure them in your deployment platform:

```env
# Example variables (adjust as needed)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=file:./data/medward.db
```

## Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Login page works
- [ ] Dashboard is accessible at `/admin/login-failures`
- [ ] Test a login failure (wrong credentials, network error)
- [ ] Check dashboard shows captured failure
- [ ] Verify data persistence (refresh page, data remains)
- [ ] Check browser console for errors
- [ ] Test on mobile devices

## Monitoring

### Check Failures
```bash
# Access dashboard
https://your-domain.com/admin/login-failures

# Or use API
curl https://your-domain.com/api/analytics/login-failures/stats
```

### View Logs
- **Vercel**: Dashboard > Deployments > Select deployment > Runtime Logs
- **Netlify**: Dashboard > Deploys > Select deploy > Deploy log
- **Railway**: Dashboard > Service > Deployments > Logs

## Troubleshooting

### Issue: 404 on `/admin/login-failures`

**Solution:**
- Ensure the branch with changes is deployed
- Check build logs for errors
- Verify `app/admin/login-failures/page.js` exists

### Issue: Database not persisting

**Solution:**
```bash
# Ensure data directory exists
mkdir -p data

# Check database permissions
ls -la data/

# For deployment platforms, use persistent storage:
# - Vercel: Use Vercel Postgres or external DB
# - Netlify: Use Netlify Blobs
# - Railway: Use Railway Volumes
```

### Issue: Analyzer not capturing failures

**Solution:**
1. Open browser console during login
2. Look for `[Login] Error:` logs
3. Check `[FailureAnalyzer] Captured failure:` logs
4. Verify localStorage has `medward_login_failures` key
5. Check network tab for API calls to `/api/analytics/login-failures`

### Issue: CORS errors in production

**Solution:**
```javascript
// Ensure Google Apps Script has correct headers
function doPost(e) {
  const output = ContentService.createTextOutput(
    JSON.stringify({success: true, data: result})
  );
  output.setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}

function doOptions(e) {
  return doPost(e); // Handle preflight requests
}
```

## Branch-Specific Deployment

### Deploy Feature Branch

**Vercel:**
```bash
# Deploy specific branch
vercel --prod --branch=claude/login-failure-analyzer-ZvICL
```

**Netlify:**
- Dashboard > Site settings > Build & deploy
- Branch deploys > Add branch
- Enter: `claude/login-failure-analyzer-ZvICL`

**Railway:**
```bash
# Create environment for branch
railway environment create --name feature-branch
railway link
railway up
```

## Continuous Deployment

### GitHub Actions (Vercel)

Create `.github/workflows/deploy-vercel.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
      - claude/**  # Deploy all claude branches
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy
        run: |
          if [ "${{ github.event_name }}" == "pull_request" ]; then
            vercel --token=${{ secrets.VERCEL_TOKEN }}
          else
            vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
          fi
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Security Notes

- The analyzer stores failure data locally and on server
- No passwords or sensitive data are captured
- Only error messages, timing, and network info are stored
- Consider adding authentication to `/admin/*` routes in production

### Add Authentication (Optional)

```javascript
// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check authentication
    const token = request.cookies.get('medward_token');
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
}

export const config = {
  matcher: '/admin/:path*'
};
```

## Support

For deployment issues:
- Check deployment platform docs
- Review build logs
- Test locally first
- Check GitHub issues

For analyzer issues:
- See `docs/LOGIN_FAILURE_ANALYZER.md`
- Check browser console
- Review captured failures in dashboard
