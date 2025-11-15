# 🎯 RunPod Templates & Exempel Repos

## Problem

Ollama-installation i Dockerfile orsakar problem. Låt oss använda ett RunPod template eller exempel-repo istället!

## Lösning: Använd RunPod Ollama Template

RunPod har templates som redan har Ollama konfigurerat. Detta är mycket enklare!

---

## Option 1: RunPod Ollama Template (Rekommenderat)

### Steg 1: Skapa nytt Endpoint från Template

1. **Gå till RunPod Dashboard → Serverless**
2. **Klicka "New Endpoint"**
3. **Välj "Templates" tab** (istället för "Import Git Repository")
4. **Sök efter "Ollama"**
5. **Välj "Ollama Serverless" eller liknande template**

### Steg 2: Konfigurera Template

**Basic Settings:**
- Endpoint Name: `nocturne-ollama`
- GPU Type: A40 eller RTX 3090
- Worker Type: Flex

**Template Settings:**
- Model: `nocturne-swe` (eller din modell)
- Environment Variables:
  ```
  OLLAMA_MODEL=nocturne-swe
  OLLAMA_HOST=0.0.0.0:11434
  ```

### Steg 3: Anpassa för din handler.py

Efter att endpoint är skapad:
- Du kan antingen:
  - **Option A:** Använd template som den är och anropa Ollama direkt
  - **Option B:** Lägg till din handler.py via GitHub integration senare

---

## Option 2: Fork RunPod Ollama Exempel Repo

RunPod har förmodligen exempel-repos på GitHub:

1. **Sök på GitHub:**
   - `runpod/ollama-serverless`
   - `runpod/serverless-templates`
   - `runpod/ollama-example`

2. **Fork repo:**
   - Klicka "Fork" på GitHub
   - Lägg till din handler.py
   - Push till ditt fork

3. **Använd i RunPod:**
   - Skapa endpoint från ditt fork
   - Konfigurera som vanligt

---

## Option 3: Använd RunPod Ollama Base Image

Istället för att installera Ollama själv, använd RunPods Ollama base image:

```dockerfile
FROM runpod/ollama:latest

WORKDIR /app
COPY handler.py /app/handler.py
COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir runpod requests

ENV OLLAMA_MODEL=nocturne-swe
ENV OLLAMA_HOST=0.0.0.0:11434

CMD ["python", "/app/handler.py"]
```

**Kolla om `runpod/ollama:latest` finns:**
- RunPod kan ha en officiell Ollama image
- Eller använd `ollama/ollama:latest` från Docker Hub

---

## Option 4: Använd Ollama Docker Image direkt

```dockerfile
FROM ollama/ollama:latest

# Install Python och dependencies
RUN apt-get update && apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY handler.py /app/handler.py
COPY requirements.txt /app/requirements.txt

RUN pip3 install --no-cache-dir runpod requests

ENV OLLAMA_MODEL=nocturne-swe
ENV OLLAMA_HOST=0.0.0.0:11434

CMD ["python3", "/app/handler.py"]
```

---

## Rekommendation

**Börja med Option 1 (RunPod Template)** - det är enklast och mest testat!

Om template inte finns eller inte fungerar:
- Prova Option 4 (Ollama Docker image direkt)
- Eller Option 3 (RunPod Ollama base image om den finns)

---

**Vilken option vill du prova först?** 🚀

