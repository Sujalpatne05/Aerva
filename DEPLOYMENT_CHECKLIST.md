# ✅ Vercel Deployment Checklist

## Before You Deploy

- [x] Frontend connected to remote backend (`https://aerva-backend.onrender.com`)
- [x] Environment variable uses Vite format (`VITE_API_URL`)
- [x] Frontend builds successfully locally (`npm run build`)
- [x] `vercel.json` configured correctly
- [ ] Code pushed to GitHub/GitLab/Bitbucket

## Quick Deploy Steps

### Option 1: Via Vercel Dashboard (Easiest)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel**
   - Visit https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repository

3. **Configure Project**
   - Root Directory: `aerva-react`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variable**
   - Name: `VITE_API_URL`
   - Value: `https://aerva-backend.onrender.com`
   - Apply to: All environments

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get your live URL!

### Option 2: Via CLI (Advanced)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd aerva-react
vercel --prod

# Set environment variable
vercel env add VITE_API_URL
# Enter: https://aerva-backend.onrender.com
```

## What Will Be Deployed

✅ **Included:**
- `aerva-react/` folder (your frontend)
- All React components, pages, styles
- Built and optimized JavaScript/CSS
- PWA service worker
- Static assets (icons, images)

❌ **Excluded:**
- `aerva-backend-main/` (stays local or separate deployment)
- `.env` file (use Vercel environment variables)
- `node_modules/` (rebuilt automatically)

## After Deployment

Your app will be live at:
- **Vercel URL**: `https://your-app-name.vercel.app`
- **Backend URL**: `https://aerva-backend.onrender.com`

### Test Your Deployment

1. Open the Vercel URL
2. Check dashboard loads
3. Verify sensor data appears
4. Test real-time updates
5. Try generating reports

## Environment Configuration

| Environment | Frontend URL | Backend URL |
|-------------|--------------|-------------|
| **Local** | http://localhost:5173 | https://aerva-backend.onrender.com |
| **Vercel (Production)** | https://your-app.vercel.app | https://aerva-backend.onrender.com |

## Need Help?

- Full guide: See `VERCEL_DEPLOYMENT.md`
- Vercel docs: https://vercel.com/docs
- Issues? Check browser console and Vercel build logs

---

**Ready to deploy?** Start with Step 1! 🚀
