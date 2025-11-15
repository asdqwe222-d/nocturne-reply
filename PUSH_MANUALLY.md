# 📤 Push Dockerfile Manuellt

## Git är inte tillgängligt i PowerShell

Du behöver pusha Dockerfile manuellt. Här är två alternativ:

---

## Alternativ 1: Använd Git Bash eller Command Prompt

Om du har Git installerat, öppna **Git Bash** eller **Command Prompt** och kör:

```bash
cd C:\Users\Oliwer\Desktop\Cursor\Nocturne\gpt-relay-server

git add Dockerfile
git commit -m "Remove pre-load step - fix build failure"
git push
```

---

## Alternativ 2: Använd GitHub Desktop eller Web UI

### Via GitHub Web UI:

1. Gå till: https://github.com/asdqwe222-d/nocturne-reply
2. Klicka på `Dockerfile` i repo root
3. Klicka på penn-ikonen (Edit)
4. Ta bort raderna 13-18 (pre-load step):
   ```dockerfile
   # Pre-load model during build to reduce cold start time
   # This reduces cold start from 30-60s to 10-15s
   RUN ollama serve & \
       sleep 10 && \
       ollama pull nocturne-swe && \
       pkill ollama || true
   ```
5. Spara ändringarna
6. Commit message: "Remove pre-load step - fix build failure"
7. Commit changes

---

## Alternativ 3: Kopiera Uppdaterad Dockerfile

Här är den uppdaterade Dockerfile som ska pushas:

```dockerfile
# RunPod Serverless Dockerfile for Ollama
FROM runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set working directory
WORKDIR /app

# Copy handler and requirements
# Files are in repo root (not in gpt-relay-server/ subdirectory)
COPY handler.py /app/handler.py
COPY requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir \
    runpod \
    requests

# Set environment variables
ENV OLLAMA_MODEL=nocturne-swe
ENV OLLAMA_HOST=0.0.0.0:11434

# Expose Ollama port
EXPOSE 11434

# Start Ollama and handler
CMD ["python", "/app/handler.py"]
```

---

## Efter Push

1. RunPod kommer automatiskt detektera ändringen
2. En ny build startar automatiskt
3. Build bör nu lyckas (inga pre-load steg)

---

**Välj det alternativ som passar dig bäst!**

