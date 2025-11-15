# 🎯 Använd RunPod Template istället

## Problem

Ollama-installation i Dockerfile orsakar problem. Låt oss använda RunPod templates eller exempel-repos istället!

---

## Option 1: RunPod Hub - Ollama Templates (Rekommenderat)

RunPod har ett **Hub** med förkonfigurerade templates: https://docs.runpod.io/hub

### Steg 1: Sök efter Ollama Template

1. **Gå till RunPod Dashboard**
2. **Klicka "Serverless" → "New Endpoint"**
3. **Välj "Templates" tab** (eller "Hub")
4. **Sök efter "Ollama"**
5. **Välj ett Ollama template** (t.ex. "Ollama Serverless")

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
- Template har redan Ollama installerat och konfigurerat
- Du kan anropa Ollama direkt via API
- Eller lägg till din handler.py senare via GitHub integration

---

## Option 2: Använd Ollama Docker Image direkt

Istället för att installera Ollama, använd Ollamas officiella Docker image:

### Uppdatera Dockerfile:

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

# Start Ollama i bakgrunden och sedan handler
CMD ollama serve & sleep 5 && python3 /app/handler.py
```

**Fördelar:**
- ✅ Ollama är redan installerat och konfigurerat
- ✅ Mindre risk för installation-problem
- ✅ Officiell image = mer stabil

---

## Option 3: Använd RunPod Ollama Base Image (Om den finns)

Kolla om RunPod har en officiell Ollama base image:

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

**Kolla om denna image finns:**
- RunPod kan ha en officiell Ollama image
- Eller sök i RunPod Hub efter "ollama"

---

## Option 4: Fork RunPod Ollama Exempel Repo

RunPod kan ha exempel-repos på GitHub:

1. **Sök på GitHub:**
   - `runpod/ollama-serverless`
   - `runpod/serverless-templates`
   - `runpod/ollama-example`
   - `runpodio/serverless-handlers`

2. **Fork repo:**
   - Klicka "Fork" på GitHub
   - Lägg till din handler.py
   - Push till ditt fork

3. **Använd i RunPod:**
   - Skapa endpoint från ditt fork
   - Konfigurera som vanligt

---

## Rekommendation

**Börja med Option 2 (Ollama Docker Image)** - det är enklast och mest testat!

Om det inte fungerar:
- Prova Option 1 (RunPod Template från Hub)
- Eller Option 4 (Fork exempel-repo)

---

## Nästa Steg

Vilken option vill du prova?

1. **Option 2** - Uppdatera Dockerfile med `ollama/ollama:latest` ⭐ (Rekommenderat)
2. **Option 1** - Använd RunPod Template från Hub
3. **Option 4** - Fork RunPod exempel-repo

---

**Vill du att jag uppdaterar Dockerfile med Option 2?** 🚀

