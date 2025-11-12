# 📦 GitHub Setup for RunPod Serverless

## Overview

RunPod Serverless can deploy directly from GitHub repositories. This guide shows you how to set it up.

---

## Step 1: Create GitHub Repository

### 1.1 Create New Repository

1. Go to https://github.com/new
2. Repository name: `nocturne-reply-forge` (or your preferred name)
3. Description: "Ollama serverless endpoint for Nocturne Reply Forge"
4. Visibility: **Private** (recommended) or Public
5. **DO NOT** initialize with README (we'll push existing code)
6. Click **"Create repository"**

### 1.2 Initialize Git (if not already done)

```bash
cd gpt-relay-server
git init
git add .
git commit -m "Initial commit - RunPod Serverless setup"
```

### 1.3 Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/nocturne-reply-forge.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Prepare Repository for RunPod

### 2.1 Required Files

Your repository needs these files:

```
gpt-relay-server/
├── handler.py              # RunPod handler (Python)
├── Dockerfile              # Docker configuration
├── .runpod/
│   ├── hub.json           # RunPod metadata
│   └── tests.json         # Test configuration
├── .gitignore             # Git ignore rules
└── README.md              # Documentation (optional)
```

### 2.2 Update `.runpod/hub.json`

Edit `.runpod/hub.json` and update:
- `repository`: Your GitHub repo URL
- `name`: Your endpoint name
- `display_name`: Display name in RunPod

### 2.3 Commit and Push

```bash
git add .
git commit -m "Add RunPod Serverless configuration"
git push
```

---

## Step 3: Connect GitHub to RunPod

### 3.1 Connect GitHub Account

1. Go to RunPod Dashboard
2. Click **Settings** → **Connections**
3. Find **GitHub** card
4. Click **"Connect"**
5. Authorize RunPod to access your repositories
6. Select repositories (or allow all)

### 3.2 Create Release (Optional but Recommended)

RunPod watches GitHub releases for updates:

1. Go to your GitHub repository
2. Click **"Releases"** → **"Create a new release"**
3. Tag: `v1.0.0`
4. Title: `Initial RunPod Serverless Release`
5. Description: `RunPod Serverless endpoint for Ollama inference`
6. Click **"Publish release"**

---

## Step 4: Deploy from GitHub

### 4.1 Create Endpoint from GitHub

1. Go to RunPod Dashboard → **Serverless**
2. Click **"New Endpoint"**
3. Select **"Import Git Repository"** tab
4. Choose your repository: `YOUR_USERNAME/nocturne-reply-forge`
5. Select branch: `main` (or `master`)
6. **Optional:** Select release tag (e.g., `v1.0.0`)

### 4.2 Configure Endpoint

**Basic Settings:**
- **Endpoint Name:** `nocturne-ollama`
- **GPU Type:** A40 or RTX 3090
- **Worker Type:** Flex or Active

**Build Settings:**
- **Dockerfile Path:** `gpt-relay-server/Dockerfile` (or just `Dockerfile` if in root)
- **Handler Path:** `gpt-relay-server/handler.py` (or just `handler.py` if in root)

**Environment Variables:**
```
OLLAMA_MODEL=nocturne-swe
OLLAMA_HOST=0.0.0.0:11434
```

### 4.3 Deploy

1. Review settings
2. Click **"Create Endpoint"**
3. Wait for build to complete (2-5 minutes)
4. Copy endpoint URL

---

## Step 5: Update Your `.env`

Add to `gpt-relay-server/.env`:

```bash
RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
RUNPOD_API_KEY=your-api-key-here
RUNPOD_FALLBACK=true
```

---

## Alternative: Docker Hub (Easier)

If you prefer **not** to use GitHub, you can push to Docker Hub instead:

### Option A: Docker Hub

1. Build Docker image:
```bash
cd gpt-relay-server
docker build -t yourusername/nocturne-ollama:latest .
```

2. Push to Docker Hub:
```bash
docker push yourusername/nocturne-ollama:latest
```

3. In RunPod, select **"Docker Image"** instead of GitHub
4. Enter: `yourusername/nocturne-ollama:latest`

---

## Repository Structure

Your GitHub repo should look like this:

```
nocturne-reply-forge/
├── gpt-relay-server/
│   ├── handler.py          # RunPod handler
│   ├── Dockerfile          # Docker config
│   ├── .runpod/
│   │   ├── hub.json        # RunPod metadata
│   │   └── tests.json      # Tests
│   ├── .gitignore          # Git ignore
│   └── README.md           # Docs
└── README.md               # Main README
```

---

## Updating Your Endpoint

### Method 1: GitHub Release (Recommended)

1. Make changes to code
2. Commit and push:
```bash
git add .
git commit -m "Update handler"
git push
```

3. Create new release:
   - Tag: `v1.0.1`
   - RunPod will auto-detect and rebuild

### Method 2: Manual Rebuild

1. Go to RunPod Dashboard → Serverless
2. Click on your endpoint
3. Click **"Rebuild"**
4. Select branch/release
5. Click **"Rebuild"**

---

## Troubleshooting

### Problem: "Repository not found"

**Solution:**
- Check GitHub connection in RunPod Settings
- Verify repository name is correct
- Make sure RunPod has access to the repo

### Problem: "Build failed"

**Solution:**
- Check RunPod endpoint logs
- Verify Dockerfile syntax
- Check handler.py for errors
- Ensure all dependencies are in Dockerfile

### Problem: "Handler not found"

**Solution:**
- Check handler path in endpoint config
- Verify handler.py is in correct location
- Check Dockerfile CMD points to handler

---

## Quick Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] `.runpod/hub.json` configured
- [ ] `handler.py` created
- [ ] `Dockerfile` created
- [ ] GitHub connected to RunPod
- [ ] Endpoint created from GitHub
- [ ] Endpoint URL copied
- [ ] `.env` updated
- [ ] Server tested

---

**Next:** Follow `RUNPOD_SETUP_DETAILED.md` for endpoint configuration!

