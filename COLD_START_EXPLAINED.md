# ⏱️ RunPod Serverless Cold Start Explained

## What is a Cold Start?

A **cold start** happens when RunPod needs to:
1. Start a new container (if none are running)
2. Load the model into GPU memory
3. Initialize Ollama server

This can take **30-60 seconds** the first time.

---

## When Do Cold Starts Happen?

### Flex Workers (Pay-per-use) - Current Setup

**Cold start happens:**
- ✅ **Every time** you make a request after inactivity
- ✅ **First request** of the day
- ✅ After container shuts down (usually after ~5-10 minutes of inactivity)

**Warm start (fast):**
- ✅ Subsequent requests within the same session (~5 seconds)
- ✅ While container is still running

**Timeline:**
```
Request 1: [Cold Start] 30-60s → Response
Request 2: [Warm] 5s → Response  (same container)
Request 3: [Warm] 5s → Response  (same container)
... (5-10 min inactivity) ...
Request 4: [Cold Start] 30-60s → Response  (new container)
```

### Active Workers (Always-on)

**Cold start happens:**
- ✅ **Only once** when you first deploy
- ✅ After endpoint restart/update

**Warm start (fast):**
- ✅ **All subsequent requests** (~5 seconds)
- ✅ Container stays running 24/7

**Timeline:**
```
Deploy: [Cold Start] 30-60s → Container ready
Request 1: [Warm] 5s → Response
Request 2: [Warm] 5s → Response
Request 3: [Warm] 5s → Response
... (hours later) ...
Request 100: [Warm] 5s → Response  (still same container!)
```

---

## Build Phase vs Runtime

### Build Phase (One-time)
- Happens when you deploy/rebuild endpoint
- Installs Ollama, copies files, sets up environment
- Takes **2-5 minutes**
- Only happens when you push code changes

### Runtime Cold Start (Every time with Flex)
- Happens when container starts
- Downloads model (if not pre-loaded)
- Loads model into GPU memory
- Takes **30-60 seconds**
- Happens **every time** with Flex workers after inactivity

---

## Solutions to Reduce Cold Starts

### Option 1: Pre-load Model in Dockerfile (Recommended)

Update `Dockerfile` to download model during build:

```dockerfile
# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama and pre-load model during build
RUN ollama serve & \
    sleep 10 && \
    ollama pull nocturne-swe && \
    pkill ollama || true
```

**Benefits:**
- Model is already downloaded in Docker image
- Reduces cold start from 30-60s to **10-15s**
- Still happens with Flex workers, but faster

**Trade-offs:**
- Docker image becomes larger (~4-8 GB)
- Build takes longer (~5-10 minutes)

---

### Option 2: Use Active Workers (Best for Production)

**Change in RunPod Dashboard:**
- Go to your endpoint → Settings
- Change **Worker Type** from "Flex" to "Active"

**Benefits:**
- ✅ **No cold starts** after initial deploy
- ✅ All requests are fast (~5 seconds)
- ✅ 20-30% discount on GPU cost
- ✅ Better user experience

**Trade-offs:**
- ❌ Costs money even when not in use (~$20-30/day for A40)
- ❌ Better for production/high usage

**Cost Comparison:**
- **Flex:** $0.00034/s × usage time (only pay when using)
- **Active:** ~$0.00024/s × 24 hours = ~$20-30/day (always on)

---

### Option 3: Keep Container Warm (Hack)

Make a "keep-alive" request every 5 minutes:

```javascript
// Keep container warm
setInterval(async () => {
  if (MODE === 'runpod') {
    try {
      await callRunPod('test'); // Small request
    } catch (e) {
      // Ignore errors
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

**Benefits:**
- Container stays warm
- No cold starts

**Trade-offs:**
- Costs money for keep-alive requests
- More complex

---

## Recommendation

### For Testing/Low Usage:
- ✅ **Keep Flex workers** (cheaper)
- ✅ **Pre-load model in Dockerfile** (faster cold starts)
- ✅ Accept 10-15s cold start first request

### For Production/High Usage:
- ✅ **Switch to Active workers** (no cold starts)
- ✅ **Pre-load model in Dockerfile** (faster initial deploy)
- ✅ All requests are fast (~5 seconds)

---

## Current Status

**Your current setup:**
- Worker Type: **Flex** (pay-per-use)
- Model pre-load: **No** (model downloads on first request)
- Cold start time: **30-60 seconds** (first request after inactivity)

**Expected behavior:**
- First request of the day: **30-60 seconds**
- Subsequent requests (within 5-10 min): **5 seconds**
- After inactivity: **30-60 seconds** again

---

## Quick Fix: Pre-load Model

Want me to update the Dockerfile to pre-load the model? This will:
- Reduce cold start to **10-15 seconds**
- Make Docker image larger (~4-8 GB)
- Increase build time (~5-10 minutes)

Or switch to **Active workers** for zero cold starts (but costs more).

