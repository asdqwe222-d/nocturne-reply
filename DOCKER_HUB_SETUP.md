# 🐳 Docker Hub Setup (No GitHub Required)

## Overview

Instead of GitHub, you can push your Docker image directly to Docker Hub. This is **easier** and doesn't require Git!

---

## Prerequisites

1. **Docker Desktop** installed (if not, download from https://www.docker.com/products/docker-desktop)
2. **Docker Hub account** (free at https://hub.docker.com)

---

## Step 1: Install Docker Desktop

1. Download: https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Start Docker Desktop
4. Wait for it to fully start (whale icon in system tray)

---

## Step 2: Create Docker Hub Account

1. Go to https://hub.docker.com
2. Click **"Sign Up"**
3. Create free account
4. Verify email

---

## Step 3: Build and Push Docker Image

### 3.1 Login to Docker Hub

Open PowerShell or Command Prompt:

```bash
docker login
```

Enter your Docker Hub username and password.

### 3.2 Build Docker Image

```bash
cd C:\Users\Oliwer\Desktop\Cursor\Nocturne\gpt-relay-server
docker build -t YOUR_DOCKERHUB_USERNAME/nocturne-ollama:latest .
```

**Replace `YOUR_DOCKERHUB_USERNAME`** with your actual Docker Hub username.

**Example:**
```bash
docker build -t oliwer123/nocturne-ollama:latest .
```

### 3.3 Push to Docker Hub

```bash
docker push YOUR_DOCKERHUB_USERNAME/nocturne-ollama:latest
```

**Example:**
```bash
docker push oliwer123/nocturne-ollama:latest
```

This will take a few minutes (uploading ~1-2GB image).

---

## Step 4: Create RunPod Endpoint from Docker Hub

1. Go to RunPod Dashboard → **Serverless**
2. Click **"New Endpoint"**
3. Select **"Docker Image"** tab (NOT GitHub)
4. Enter Docker image: `YOUR_DOCKERHUB_USERNAME/nocturne-ollama:latest`
5. Configure:
   - **GPU:** A40 or RTX 3090
   - **Worker Type:** Flex or Active
   - **Environment Variables:**
     ```
     OLLAMA_MODEL=nocturne-swe
     OLLAMA_HOST=0.0.0.0:11434
     ```
6. Click **"Create Endpoint"**
7. Wait for build (2-5 minutes)
8. Copy endpoint URL

---

## Step 5: Update `.env`

Add to `gpt-relay-server/.env`:

```bash
RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
RUNPOD_API_KEY=your-api-key-here
RUNPOD_FALLBACK=true
```

---

## Updating Your Image

When you make changes:

```bash
# Rebuild
docker build -t YOUR_DOCKERHUB_USERNAME/nocturne-ollama:latest .

# Push new version
docker push YOUR_DOCKERHUB_USERNAME/nocturne-ollama:latest

# In RunPod: Click "Rebuild" on your endpoint
```

---

## Troubleshooting

### Problem: "Docker is not running"

**Solution:**
- Start Docker Desktop
- Wait for it to fully start (whale icon should be steady)
- Check system tray for Docker icon

### Problem: "Cannot connect to Docker daemon"

**Solution:**
- Make sure Docker Desktop is running
- Restart Docker Desktop
- Check Docker Desktop settings → General → "Use WSL 2" (if applicable)

### Problem: "Login failed"

**Solution:**
- Check username/password
- Try: `docker logout` then `docker login` again
- Verify account at https://hub.docker.com

### Problem: "Build failed"

**Solution:**
- Check Dockerfile syntax
- Make sure you're in `gpt-relay-server` directory
- Check Docker Desktop logs

---

## Advantages of Docker Hub

✅ **No Git required** - Easier setup  
✅ **Faster updates** - Just rebuild and push  
✅ **No GitHub repo needed** - Keep code private  
✅ **Direct control** - Build locally, push when ready

---

## Quick Commands Reference

```bash
# Login
docker login

# Build
docker build -t YOUR_USERNAME/nocturne-ollama:latest .

# Push
docker push YOUR_USERNAME/nocturne-ollama:latest

# Check images
docker images

# Test locally (optional)
docker run -p 11434:11434 YOUR_USERNAME/nocturne-ollama:latest
```

---

**This is the EASIEST method - no Git needed!**

