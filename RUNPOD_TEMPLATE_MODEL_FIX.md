# 🔧 Köra Anpassad Modell med RunPod Hub Template

## Problem

Du använder **RunPod Hub template** (`SvenBrnn/runpod-worker-ollama`), vilket betyder:
- ❌ Du kan inte ändra Dockerfile direkt
- ❌ Du kan inte ändra handler.py direkt
- ❌ Template förväntar sig att modellen redan finns i Ollama's registry
- ❌ `nocturne-swe` finns inte i Ollama's registry (det är en anpassad modell)

---

## ✅ Lösning 1: Använd Standardmodell (Enklast)

**Använd en modell som finns i Ollama's registry:**

### Steg 1: Ändra Environment Variable

I RunPod Dashboard → Edit Endpoint → Environment Variables:

```
OLLAMA_MODEL_NAME=llama3
```

Eller:
```
OLLAMA_MODEL_NAME=mistral
```

### Steg 2: Uppdatera Lokal `.env`

```bash
OLLAMA_MODEL=llama3
```

### Steg 3: Testa

Detta fungerar direkt eftersom modellen finns i Ollama's registry.

**Nackdel:** Du får inte din anpassade `nocturne-swe` modell med system prompts.

---

## ✅ Lösning 2: Skapa Modellen via Start Command (Avancerat)

RunPod templates har ofta en "Start Command" där du kan köra scripts.

### Steg 1: Skapa ett Startup Script

Skapa en fil `create-model.sh`:

```bash
#!/bin/bash
# Pull base model
ollama pull mistral-nemo:12b-instruct-2407-q4_K_M

# Create custom model from Modelfile
cat > /tmp/Modelfile << 'EOF'
FROM mistral-nemo:12b-instruct-2407-q4_K_M

PARAMETER temperature 0.8
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.3
PARAMETER num_ctx 8192

SYSTEM """
You are a flirty, confident Swedish woman texting...
[Resten av din Modelfile]
"""
EOF

ollama create nocturne-swe -f /tmp/Modelfile
```

### Steg 2: Lägg till Start Command i RunPod

I RunPod Dashboard → Edit Endpoint → Docker Configuration → Start Command:

```bash
sh -c "ollama pull mistral-nemo:12b-instruct-2407-q4_K_M && ollama create nocturne-swe -f <(cat << 'EOF'
FROM mistral-nemo:12b-instruct-2407-q4_K_M
PARAMETER temperature 0.8
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.3
PARAMETER num_ctx 8192
SYSTEM \"\"\"
You are a flirty, confident Swedish woman texting...
\"\"\"
EOF
) && [original start command]"
```

**Problem:** Detta är komplicerat och kan vara svårt att få rätt.

---

## ✅ Lösning 3: Bygg Egen Docker Image (Bäst för Anpassad Modell)

### Steg 1: Bygg Docker Image Lokalt eller via GitHub Actions

Använd din egen Dockerfile som skapar modellen automatiskt.

### Steg 2: Push till RunPod Registry

```bash
# Login till RunPod Registry
docker login registry.runpod.net -u <your-runpod-username> -p <your-runpod-api-key>

# Tag image
docker tag your-image:latest registry.runpod.net/your-username/your-image:latest

# Push
docker push registry.runpod.net/your-username/your-image:latest
```

### Steg 3: Använd Din Image i RunPod

I RunPod Dashboard → Edit Endpoint → Docker Configuration → Container Image:

```
registry.runpod.net/your-username/your-image:latest
```

**Fördel:** Full kontroll över modellskapande
**Nackdel:** Kräver Docker och RunPod Registry access

---

## ✅ Lösning 4: Använd Network Volume (Persistent Storage)

### Steg 1: Skapa Network Volume i RunPod

RunPod Dashboard → Storage → Create Volume

### Steg 2: Ladda Upp Modelfile till Volymen

Via RunPod Pod eller direkt upload.

### Steg 3: Mounta Volymen i Endpoint

I Edit Endpoint → Advanced → Network Volume → Välj din volume

### Steg 4: Skapa Modellen vid Startup

Via Start Command eller environment variable script.

**Fördel:** Modellen sparas mellan restarts
**Nackdel:** Kräver extra konfiguration

---

## 🎯 Rekommendation

**För nu:** Använd **Lösning 1** (standardmodell) för att få det att fungera snabbt.

**Senare:** Implementera **Lösning 3** (egen Docker image) för din anpassade modell.

---

## 🚀 Snabb Fix Nu

1. **Gå till RunPod Dashboard → Edit Endpoint**
2. **Environment Variables → Ändra:**
   ```
   OLLAMA_MODEL_NAME=llama3
   ```
3. **Spara**
4. **Testa**

Detta fungerar direkt! 🎉

