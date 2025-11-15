# 🔧 Build Failed - Fix Guide

## Problem

Build failed likely because the pre-load step is trying to run Ollama in background during Docker build, which doesn't work well.

## Solution: Fix Pre-load Approach

The issue is that `ollama serve &` (background process) doesn't work reliably in Docker build context.

### Option 1: Remove Pre-load (Simplest)

Remove the pre-load step and let the model download at runtime. This means:
- ✅ Build succeeds
- ✅ Cold start: 30-60 seconds (model downloads on first request)
- ✅ Simpler Dockerfile

### Option 2: Fix Pre-load (Better for production)

Use a different approach that works in Docker build:

```dockerfile
# Pre-load model during build
RUN ollama serve & sleep 15 && \
    timeout 300 ollama pull nocturne-swe || true && \
    pkill -f ollama || true
```

Or better yet, use a script approach.

### Option 3: Skip Pre-load for Now

Remove pre-load step, get build working first, then optimize later.

---

## Quick Fix: Remove Pre-load Step

Remove lines 13-18 from Dockerfile:

```dockerfile
# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set working directory (remove pre-load step)
WORKDIR /app
```

This will:
- ✅ Make build succeed
- ✅ Cold start: 30-60s (acceptable for testing)
- ✅ Can add pre-load later if needed

---

**Recommendation: Remove pre-load for now, get build working, then optimize!**

