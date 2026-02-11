# 🚀 Netlify Deployment Guide

## Prerequisites
- Netlify account (free tier is sufficient)
- GitHub/GitLab repository (optional, can also deploy via CLI)
- Supabase project with credentials

---

## 📋 Environment Variables

Before deploying, you need to set up these environment variables in Netlify:

### Required Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### How to Get Supabase Credentials:
1. Go to your Supabase project
2. Navigate to: **Project Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Key (anon/public)** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🌐 Deployment Methods

### Method 1: Deploy via Netlify Dashboard (Recommended)

#### Step 1: Push to GitHub
```bash
# If not already initialized
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

#### Step 2: Connect to Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Base directory:** (leave empty)

#### Step 3: Add Environment Variables
1. In Netlify site settings, go to: **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add both:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Step 4: Deploy
1. Click **"Deploy site"**
2. Wait 3-5 minutes for build to complete
3. Your site will be live at: `https://your-site-name.netlify.app`

---

### Method 2: Deploy via Netlify CLI

#### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 2: Login to Netlify
```bash
netlify login
```

#### Step 3: Initialize Site
```bash
netlify init
```
Follow the prompts to create a new site or link to an existing one.

#### Step 4: Set Environment Variables
```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://your-project-id.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-anon-key-here"
```

#### Step 5: Deploy
```bash
# For production deployment
netlify deploy --prod

# For preview deployment (test first)
netlify deploy
```

---

## ✅ Post-Deployment Checklist

### 1. Test Core Features
- [ ] Homepage loads with models
- [ ] User registration and login work
- [ ] Model profiles display correctly
- [ ] Dashboard access works for all roles
- [ ] File uploads work (photos, banners)

### 2. Update Supabase Settings
Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

Add your Netlify domain to:
- **Site URL:** `https://your-site-name.netlify.app`
- **Redirect URLs:** 
  ```
  https://your-site-name.netlify.app/auth/callback
  https://your-site-name.netlify.app/dashboard
  https://your-site-name.netlify.app/onboarding
  ```

### 3. Configure Custom Domain (Optional)
1. In Netlify: **Domain settings** → **Add custom domain**
2. Follow DNS configuration instructions
3. Enable HTTPS (automatic with Netlify)

---

## 🔧 Troubleshooting

### Build Fails with "Module not found"
```bash
# Clear cache and rebuild
netlify build --clear-cache
```

### Environment Variables Not Working
- Make sure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing environment variables
- Check for typos in variable names

### 404 on Page Refresh
- This is already handled by `netlify.toml` redirects
- If issues persist, check Next.js configuration

### Images Not Loading
- Verify Supabase storage bucket policies allow public access
- Check CORS settings in Supabase dashboard

---

## 📊 Monitoring

### Netlify Analytics
Enable in: **Site settings** → **Analytics** (paid feature)

### Deploy Notifications
Configure in: **Site settings** → **Build & deploy** → **Deploy notifications**
- Email notifications
- Slack/Discord webhooks
- GitHub commit status

---

## 🔄 Continuous Deployment

Once connected to Git, Netlify automatically:
1. Deploys on every push to `main` branch
2. Creates preview deployments for pull requests
3. Runs build checks before deployment

### Disable Auto-Deploy (if needed)
**Site settings** → **Build & deploy** → **Continuous deployment** → **Stop builds**

---

## 📝 Important Notes

### Beta Features
During beta, some features are set to "free":
- Model ad activation (free ads)
- Club ad activation (free ads)

Remember to update these when going live!

### Database Backups
Ensure regular Supabase backups are enabled:
**Supabase Dashboard** → **Database** → **Backups**

### Security
- Never commit `.env.local` to git
- Rotate API keys if exposed
- Use Row Level Security (RLS) policies in Supabase

---

## 🆘 Support

If you encounter issues:
1. Check Netlify deploy logs
2. Review Supabase logs
3. Test locally with `npm run build` and `npm run start`
4. Check browser console for errors

---

## 🎉 Success!

Your site is now live at: `https://your-site-name.netlify.app`

Next steps:
- [ ] Test all features
- [ ] Configure custom domain
- [ ] Set up monitoring
- [ ] Share with users!
