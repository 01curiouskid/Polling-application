# Easy Free Deployment Guide

## Option 1: Vercel (Frontend) + Render (Backend) - RECOMMENDED

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

### Step 2: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" → Connect GitHub
3. Select your repository
4. Vercel auto-detects React app
5. Add environment variable: `VITE_BACKEND_URL=https://your-app-name.onrender.com`
6. Click "Deploy"

### Step 3: Deploy Backend to Render
1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: your-app-name
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: `PORT=3001`
5. Click "Create Web Service"

### Step 4: Update Frontend Environment
1. In Vercel dashboard, update `VITE_BACKEND_URL` to your Render URL
2. Redeploy Vercel

## Option 2: Glitch (Both Frontend + Backend)
1. Go to [glitch.com](https://glitch.com)
2. Click "New Project" → "Import from GitHub"
3. Enter your GitHub repo URL
4. Glitch automatically deploys both frontend and backend

## Option 3: Netlify + Railway
Similar to Option 1 but using:
- Frontend: [netlify.com](https://netlify.com)
- Backend: [railway.app](https://railway.app)

## Important Notes
- All these options have generous free tiers
- WebSocket (Socket.io) works on Render/Railway/Glitch
- Vercel/Netlify are best for static frontend hosting
- Your app will be live in under 10 minutes!
