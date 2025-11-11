# Quick Deploy Guide - 5 Minutes to Production

## Step 1: Push to GitHub (2 minutes)

### Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `ai-voice-chat-pwa`
3. Visibility: **Public** (or Private)
4. **DO NOT** check "Initialize with README"
5. Click "Create repository"

### Push Your Code
Copy the repository URL (looks like: `https://github.com/YOUR_USERNAME/ai-voice-chat-pwa.git`)

Then run these commands:
```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-voice-chat-pwa.git
git push -u origin main
```

✅ **Done!** Your code is now on GitHub.

---

## Step 2: Deploy to Vercel (3 minutes)

### Import to Vercel
1. Go to: https://vercel.com/new
2. Login with GitHub (or create account)
3. Click "Import Git Repository"
4. Find and select `ai-voice-chat-pwa`
5. Click "Import"

### Configure (Auto-Detected)
Vercel will auto-detect everything:
- ✅ Framework: Vite
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`

**Environment Variables:** SKIP - Not needed! API keys are client-side.

### Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. ✅ **DONE!** You'll get a URL like: `https://ai-voice-chat-pwa.vercel.app`

---

## Step 3: Test Your Deployment (1 minute)

Visit your Vercel URL and test:
- [ ] App loads correctly
- [ ] Can open Settings panel
- [ ] Can enter API keys
- [ ] PWA install prompt appears (on mobile)

---

## 🎉 Success!

Your app is live at: `https://your-project.vercel.app`

### What Happens Next?

**Auto-Deployments Enabled:**
Every time you push to `main` branch, Vercel automatically deploys!

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel deploys automatically! 🚀
```

### Share With Users

Send them your Vercel URL and they can:
1. Visit the URL
2. Install as PWA (optional)
3. Enter their own API keys
4. Start chatting!

---

## Need Help?

- **Full Guide**: See `DEPLOYMENT.md`
- **Vercel Docs**: https://vercel.com/docs
- **Status**: Check Vercel dashboard for deployment status

---

## Common Issues

### Build Failed?
```bash
# Test locally first
npm run build
npm run preview
```

### Can't Push to GitHub?
```bash
# Check remote is set
git remote -v

# If no remote, add it
git remote add origin https://github.com/YOUR_USERNAME/ai-voice-chat-pwa.git
```

### Vercel Not Finding Repo?
- Make sure repository is public, or
- Grant Vercel access to private repositories in GitHub settings
