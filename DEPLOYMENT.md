# Deployment Guide - Resonance AI Voice Chat PWA

Complete guide for deploying Resonance to Vercel production.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- [GitHub](https://github.com/) account
- [Vercel](https://vercel.com/) account (free tier works perfectly)
- Git installed locally

## Deployment Steps

### 1. Push to GitHub

#### Option A: Create Repository via GitHub CLI (Recommended)
```bash
# Install GitHub CLI if not already installed
# macOS: brew install gh
# Windows: winget install --id GitHub.cli

# Authenticate with GitHub
gh auth login

# Create repository and push
gh repo create ai-voice-chat-pwa --public --source=. --push
```

#### Option B: Create Repository Manually
1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `ai-voice-chat-pwa`
3. Choose **Public** or **Private**
4. **DO NOT** initialize with README, .gitignore, or license
5. Copy the repository URL (e.g., `https://github.com/yourusername/ai-voice-chat-pwa.git`)

Then run:
```bash
git remote add origin https://github.com/yourusername/ai-voice-chat-pwa.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended for First Deploy)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
   - Login or create account (can use GitHub login)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Connect your GitHub account if not already connected
   - Find and select `ai-voice-chat-pwa` repository

3. **Configure Project**
   - **Framework Preset**: Vite ✅ (auto-detected)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build` ✅ (auto-configured)
   - **Output Directory**: `dist` ✅ (auto-configured)
   - **Install Command**: `npm install` ✅ (auto-configured)
   - **Node Version**: 18.x or 20.x ✅

4. **Environment Variables**
   - **SKIP THIS** - No environment variables needed!
   - API keys are client-side (users enter their own)

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like: `https://ai-voice-chat-pwa.vercel.app`

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - What's your project's name? ai-voice-chat-pwa
# - In which directory is your code located? ./
# - Want to override settings? No
```

### 3. Verify Deployment

1. **Visit your deployment URL**
   - Format: `https://[project-name].vercel.app`
   - Or: `https://[project-name]-[hash].vercel.app`

2. **Test Core Features**
   - ✅ App loads and displays correctly
   - ✅ PWA install prompt appears (mobile/Chrome)
   - ✅ Service worker registers (check DevTools → Application)
   - ✅ Settings panel opens
   - ✅ Can enter API keys

3. **Test N8N Integration** (if you use N8N)
   - ✅ Open Settings → N8N Configuration
   - ✅ Enter N8N Cloud URL and API key
   - ✅ Test connection succeeds
   - ✅ Workflows load in Workflows tab
   - ✅ Can trigger webhook successfully

4. **Test AI Chat**
   - ✅ Enter OpenAI or Anthropic API key in Settings
   - ✅ Start a new chat session
   - ✅ Send a test message
   - ✅ AI responds correctly
   - ✅ Voice input works (allow microphone permission)

## Post-Deployment Configuration

### Custom Domain (Optional)

1. **Add Custom Domain in Vercel**
   - Go to Project Settings → Domains
   - Add your domain (e.g., `resonance.yourdomain.com`)
   - Follow DNS configuration instructions

2. **Update DNS Records**
   - Add `CNAME` record pointing to `cname.vercel-dns.com`
   - Or add `A` record to Vercel's IP address
   - Wait for DNS propagation (up to 48 hours)

### Enable Analytics (Optional)

1. **Vercel Analytics**
   - Go to Project Settings → Analytics
   - Click "Enable Analytics"
   - Free tier: 100k events/month

2. **Vercel Speed Insights**
   - Go to Project Settings → Speed Insights
   - Click "Enable Speed Insights"
   - Monitor Core Web Vitals

### Auto-Deployments

✅ **Already Configured!**
- Every push to `main` branch triggers automatic deployment
- Pull requests get preview deployments
- Deployments complete in 2-3 minutes

### Production Monitoring

1. **Check Deployment Logs**
   - Vercel Dashboard → Your Project → Deployments
   - Click on any deployment to see build logs
   - Check for errors or warnings

2. **Monitor Serverless Function**
   - Vercel Dashboard → Your Project → Functions
   - Monitor `/api/n8n-proxy` function
   - Check invocation count and errors

3. **View Analytics**
   - Vercel Dashboard → Your Project → Analytics
   - See page views, visitors, top pages
   - Track performance metrics

## Troubleshooting

### Build Fails

**Issue**: TypeScript errors or build failures

**Solution**:
```bash
# Test build locally first
npm run build

# Fix any TypeScript errors
npm run lint

# Test production build locally
npm run preview
```

### Service Worker Not Updating

**Issue**: Old version of app still showing after deployment

**Solution**:
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache and reload
- Unregister service worker in DevTools → Application → Service Workers

### N8N Proxy Not Working

**Issue**: N8N workflows fail to connect in production

**Solution**:
1. Check Vercel Function logs for `/api/n8n-proxy`
2. Verify N8N URL is correct (includes `https://`)
3. Test N8N API key is valid
4. Check CORS headers in Network tab

### API Keys Not Persisting

**Issue**: API keys reset after page reload

**Solution**:
- This is expected for security! Keys are client-side only
- Users must re-enter keys after clearing browser data
- Consider adding "Remember API key" option in settings

## Performance Optimization

### Lighthouse Score Targets
- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 90+
- **PWA**: 100

### Check Current Scores
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://your-app.vercel.app --view
```

### Optimization Tips
1. Enable Vercel Speed Insights
2. Monitor Core Web Vitals
3. Use Vercel Image Optimization (if adding images)
4. Enable Vercel Edge Network caching
5. Monitor bundle size with `npm run build`

## Security Best Practices

### Already Implemented ✅
- Client-side API key storage (never sent to your server)
- HTTPS enforced by Vercel
- Security headers in `vercel.json`
- Content Security Policy headers
- No sensitive data in environment variables

### Additional Security
1. **Enable Vercel Protection** (Pro plan)
   - DDoS protection
   - Password protection for deployments
   - IP allowlist

2. **Monitor Function Usage**
   - Check Vercel dashboard for unusual activity
   - Set up alerts for high invocation counts

## Rollback Procedure

If deployment has issues:

1. **Instant Rollback**
   - Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Git Rollback**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Development Workflow

### Making Changes

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make Changes and Test**
   ```bash
   npm run dev        # Development server
   npm run test       # Run tests
   npm run build      # Test production build
   npm run preview    # Test production build locally
   ```

3. **Commit and Push**
   ```bash
   git add .
   git commit -m "Add your feature"
   git push origin feature/your-feature
   ```

4. **Create Pull Request**
   - Go to GitHub repository
   - Create PR from feature branch to main
   - Vercel creates preview deployment automatically
   - Review preview deployment
   - Merge when ready

5. **Auto-Deploy to Production**
   - Merging to `main` triggers production deployment
   - Monitor deployment in Vercel dashboard

## Support & Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Deployment Status**: Check Vercel dashboard
- **Build Logs**: Available in each deployment
- **Function Logs**: Real-time logs for serverless functions
- **Community**: [Vercel Discord](https://vercel.com/discord)

## Success Checklist

After deployment, verify:

- [ ] App loads at Vercel URL
- [ ] PWA installable on mobile
- [ ] Service worker active
- [ ] Settings panel works
- [ ] Can enter API keys
- [ ] N8N connection works (if using)
- [ ] AI chat responds
- [ ] Voice input works
- [ ] Auto-deployments enabled
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] Functions invocation successful

---

🎉 **Congratulations!** Your Resonance AI Voice Chat PWA is live!

Share your deployment URL with users and enjoy your production app.
