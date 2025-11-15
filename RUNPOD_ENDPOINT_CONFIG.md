# 🎯 RunPod Endpoint Konfiguration Guide

## Viktigt: Välj rätt typ av endpoint

RunPod har två sätt att skapa endpoints:

### Option 1: Import Git Repository (Rekommenderat för oss)
- Välj **"Import Git Repository"** tab
- Detta använder din GitHub repo med Dockerfile och handler.py

### Option 2: Template/Model (Om du ser Model-fältet)
- Detta är för att köra modeller direkt från Hugging Face
- **Inte vad vi behöver** - vi använder Ollama istället

---

## Om du ser "Model" fältet (Template-baserad)

Om du ser ett fält för "Model" eller "Hugging Face", behöver du:

1. **Hitta "Import Git Repository" alternativet**
   - Leta efter tabs eller dropdown: "Template", "Docker Image", "Git Repository"
   - Välj **"Git Repository"** eller **"Import Git Repository"**

2. **Om du inte hittar Git-alternativet:**
   - Klicka på "New Endpoint" igen
   - Leta efter en dropdown eller tabs högst upp
   - Välj "Custom" eller "Git Repository"

---

## Om du ser Git Repository-alternativet

### Steg 1: Välj Repository
- Repository: `asdqwe222-d/nocturne-reply`
- Branch: `main`

### Steg 2: Container Configuration

**Container Start Command:**
```
python /app/handler.py
```

**Container Disk:**
- Sätt till **10 GB** (eller minst 5 GB)
- Ollama och modeller tar plats

**Expose HTTP Ports:**
```
11434
```

**Expose TCP Ports:**
```
(leave empty)
```

### Steg 3: Environment Variables

Klicka för att expandera och lägg till:

```
OLLAMA_MODEL=nocturne-swe
OLLAMA_HOST=0.0.0.0:11434
```

### Steg 4: GPU Selection

Välj GPU:
- **A40** (för större modeller, 70B+)
- **RTX 3090** (för mindre modeller, 12B)

### Steg 5: Worker Type

- **Flex** (pay-per-use, rekommenderat för test)
- **Active** (alltid på, 20-30% rabatt)

---

## Om du måste använda Template/Model-versionen

Om RunPod bara visar "Model" fältet och inte Git-alternativet, kan du:

### Alternativ A: Använd Docker Hub istället

1. Build och push till Docker Hub (se `DOCKER_HUB_SETUP.md`)
2. I RunPod, välj **"Docker Image"** istället
3. Ange: `yourusername/nocturne-ollama:latest`

### Alternativ B: Använd Template med Ollama

Om du måste använda Template-versionen:

1. **Model:** Lämna tomt eller ange en Ollama-modell från Hugging Face
2. **Container Start Command:**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh && ollama serve & python /app/handler.py
   ```
3. **Container Disk:** 10 GB
4. **HTTP Ports:** 11434
5. **Environment Variables:**
   ```
   OLLAMA_MODEL=nocturne-swe
   OLLAMA_HOST=0.0.0.0:11434
   ```

**OBS:** Detta kräver att du har en Docker image på Docker Hub eller att du konfigurerar en custom template.

---

## Rekommenderad väg: Docker Hub

Om Git Repository-alternativet inte finns, rekommenderar jag **Docker Hub**:

1. **Build image:**
   ```bash
   cd gpt-relay-server
   docker build -t yourusername/nocturne-ollama:latest .
   docker push yourusername/nocturne-ollama:latest
   ```

2. **I RunPod:**
   - Välj "Docker Image" tab
   - Ange: `yourusername/nocturne-ollama:latest`
   - Konfigurera som ovan

---

## Snabb Checklista

- [ ] Hittat "Import Git Repository" eller "Docker Image" alternativ
- [ ] Repository/Docker image vald
- [ ] Container Start Command: `python /app/handler.py`
- [ ] Container Disk: 10 GB
- [ ] HTTP Ports: 11434
- [ ] Environment Variables: `OLLAMA_MODEL=nocturne-swe`, `OLLAMA_HOST=0.0.0.0:11434`
- [ ] GPU vald (A40 eller RTX 3090)
- [ ] Worker Type vald (Flex rekommenderat)
- [ ] Klickat "Deploy Endpoint"

---

## När endpoint är deployad

1. Kopiera Endpoint URL
2. Skapa API Key (Settings → API Keys)
3. Uppdatera `.env`:
   ```bash
   RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ID/run
   RUNPOD_API_KEY=your-key-here
   RUNPOD_FALLBACK=true
   ```

---

**Behöver du hjälp med att hitta Git Repository-alternativet?** Kolla om det finns tabs eller en dropdown högst upp på sidan när du skapar nytt endpoint.

