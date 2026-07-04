# 🚀 Deploy AERVA Frontend to Vercel

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Git repository pushed to GitHub/GitLab/Bitbucket

## Step-by-Step Deployment

### 1. **Push Your Code to GitHub**

```bash
# Initialize git (if not already done)
git add .
git commit -m "Prepare frontend for Vercel deployment"
git push origin main
```

### 2. **Import Project to Vercel**

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your Git repository
4. Choose the repository containing your AERVA app

### 3. **Configure Build Settings**

Vercel should auto-detect these, but verify:

- **Framework Preset**: `Vite`
- **Root Directory**: `aerva-react`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. **Set Environment Variables**

In Vercel dashboard → Settings → Environment Variables, add:

```
VITE_API_URL=https://aerva-backend.onrender.com
```

**Important**: 
- Variable name: `VITE_API_URL`
- Value: `https://aerva-backend.onrender.com`
- Environment: Production, Preview, Development (select all)

### 5. **Deploy**

Click "Deploy" button. Vercel will:
1. Build your React app
2. Deploy to their CDN
3. Give you a live URL (e.g., `your-app.vercel.app`)

## Alternative: Deploy via Vercel CLI

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login
```bash
vercel login
```

### Deploy
```bash
cd aerva-react
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **aerva**
- In which directory is your code located? **.**
- Want to override the settings? **N**

### Set Environment Variable
```bash
vercel env add VITE_API_URL
```
Enter: `https://aerva-backend.onrender.com`

### Deploy to Production
```bash
vercel --prod
```

## Project Structure for Vercel

```
Averaaaaa/
├── aerva-react/          ← Frontend (this gets deployed)
│   ├── src/
│   ├── dist/            ← Build output
│   ├── package.json
│   ├── vite.config.js
│   └── .env             ← Local only (not deployed)
├── aerva-backend-main/  ← Not deployed to Vercel
└── vercel.json          ← Deployment config
```

## Important Notes

### ✅ What Gets Deployed
- Only the `aerva-react` folder (frontend)
- Built static files from `aerva-react/dist`
- Environment variables from Vercel dashboard

### ❌ What Doesn't Get Deployed
- `aerva-backend-main` folder (backend runs separately on Render)
- `.env` files (use Vercel environment variables instead)
- `node_modules` (rebuilt during deployment)

### Backend Setup
Your backend is already deployed at:
- **https://aerva-backend.onrender.com**

The frontend on Vercel will connect to this backend URL.

## Vercel Configuration Files

### vercel.json (Root)
```json
{
  "buildCommand": "cd aerva-react && npm install && npm run build",
  "outputDirectory": "aerva-react/dist",
  "installCommand": "cd aerva-react && npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### .env (aerva-react/)
```env
VITE_API_URL=https://aerva-backend.onrender.com
```

## After Deployment

1. **Get your URL**: https://your-app.vercel.app
2. **Test the app**: Open the URL and verify:
   - Dashboard loads
   - Sensor data appears
   - Charts render
   - Real-time updates work via Socket.IO

3. **Custom Domain** (optional):
   - Go to Vercel dashboard → Settings → Domains
   - Add your custom domain

## Troubleshooting

### Build fails
- Check build logs in Vercel dashboard
- Verify `aerva-react/package.json` has correct scripts
- Ensure all dependencies are in `package.json` (not just devDependencies)

### Blank screen after deployment
- Check browser console for errors
- Verify environment variable `VITE_API_URL` is set correctly
- Ensure backend URL is accessible (https://aerva-backend.onrender.com)

### API not connecting
- Check CORS settings on backend
- Verify backend is running on Render
- Check environment variable in Vercel dashboard

## Continuous Deployment

Once connected to Git:
- Every push to `main` branch → Auto-deploys to production
- Every pull request → Creates preview deployment
- Vercel provides unique URL for each deployment

## Commands Summary

```bash
# Local development
cd aerva-react
npm run dev

# Build locally (test before deploying)
cd aerva-react
npm run build

# Deploy via CLI
cd aerva-react
vercel --prod
```

---

**Your frontend will be live at**: `https://your-app.vercel.app` 🎉
