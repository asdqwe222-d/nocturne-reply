# 🔧 Dockerfile Final Fix

## Problem

`ollama/ollama:latest` image har inte Python installerat korrekt, vilket orsakar pip-installation problem.

## Lösning: Använd Python Base Image

Istället för att använda Ollama image och installera Python, använd Python image och installera Ollama!

**Ny Approach:**
```dockerfile
FROM python:3.10-slim

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Install Python dependencies
RUN pip install --no-cache-dir runpod requests
```

**Fördelar:**
- ✅ Python är redan installerat och fungerar
- ✅ `pip` fungerar direkt (ingen `pip3` eller `python3 -m pip` behövs)
- ✅ Installerar Ollama i Python image (fungerar bättre)

---

## Fullständig Dockerfile

```dockerfile
FROM python:3.10-slim

# Install system dependencies och Ollama
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app
COPY handler.py /app/handler.py
COPY requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir runpod requests

# Set environment variables
ENV OLLAMA_MODEL=nocturne-swe
ENV OLLAMA_HOST=0.0.0.0:11434

# Expose Ollama port
EXPOSE 11434

# Start Ollama i bakgrunden och sedan handler
CMD sh -c "ollama serve & sleep 5 && python /app/handler.py"
```

---

## Nästa Steg

1. **Push Dockerfile till GitHub:**
   ```bash
   cd C:\Users\Oliwer\Desktop\Cursor\Nocturne\gpt-relay-server
   git add Dockerfile
   git commit -m "Use Python base image and install Ollama"
   git push
   ```

2. **Rebuild i RunPod:**
   - Build bör nu fungera!

---

**Dockerfile är nu fixad med Python base image!** 🚀

