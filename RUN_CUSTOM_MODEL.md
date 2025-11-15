# 🎯 Köra Din Egen Modell (nocturne-swe) på RunPod

## Problem

`nocturne-swe` är en anpassad modell som skapas från en `Modelfile`. Den finns inte i Ollama's modell-register, så RunPod kan inte ladda ner den automatiskt.

---

## ✅ Lösning: Skapa Modellen Automatiskt vid Startup

Vi kommer att:
1. **Inkludera Modelfile i Docker image**
2. **Uppdatera handler.py att skapa modellen vid startup**
3. **Först pulla basmodellen** (`mistral-nemo:12b-instruct-2407-q4_K_M`)

---

## Steg 1: Kopiera Modelfile till gpt-relay-server

```bash
# Från projektets root
copy nocturne-reply-forge\Modelfile gpt-relay-server\Modelfile
```

Eller kopiera manuellt:
- **Från:** `nocturne-reply-forge/Modelfile`
- **Till:** `gpt-relay-server/Modelfile`

---

## Steg 2: Uppdatera Dockerfile

Dockerfile behöver inkludera Modelfile:

```dockerfile
COPY Modelfile /app/Modelfile
```

---

## Steg 3: Uppdatera handler.py

Handler behöver:
1. Pulla basmodellen (`mistral-nemo:12b-instruct-2407-q4_K_M`)
2. Skapa `nocturne-swe` från Modelfile om den inte finns
3. Vänta tills modellen är klar innan den accepterar requests

---

## Steg 4: Pusha till GitHub

```bash
cd gpt-relay-server
git add Modelfile Dockerfile handler.py
git commit -m "Add support for custom nocturne-swe model"
git push
```

---

## Steg 5: Uppdatera RunPod Endpoint

1. **Gå till RunPod Dashboard → Edit Endpoint**
2. **Environment Variables:**
   ```
   OLLAMA_MODEL_NAME=nocturne-swe
   ```
3. **Spara Endpoint**
4. **Vänta på att builden är klar** (kan ta 5-10 minuter första gången eftersom den laddar ner basmodellen)

---

## ⚠️ Viktigt: Första Körningen Tar Tid

När endpoint startar första gången:
1. ✅ Ollama startar
2. ✅ Pullar `mistral-nemo:12b-instruct-2407-q4_K_M` (~7GB, tar 2-5 minuter)
3. ✅ Skapar `nocturne-swe` från Modelfile (~30 sekunder)
4. ✅ Modellen är klar att använda

**Efter första körningen:** Modellen är cachad och startup är snabbare.

---

## 🧪 Testa

Efter att endpoint är "Ready":

```bash
cd gpt-relay-server
node server.js
```

Testa från `http://localhost:3000/test-chat.html`

---

## 📋 Alternativ: Använd Standardmodell Först

Om du vill testa snabbt först:

1. **Använd `llama3` eller `mistral`** (finns automatiskt)
2. **Testa att endpoint fungerar**
3. **Sedan uppdatera till `nocturne-swe`**

Detta ger dig en fungerande endpoint snabbt, sedan kan du växla till din anpassade modell.

---

## 🔍 Debugging

Om modellen inte skapas, kolla RunPod logs för:
- `[RunPod] Pulling base model...`
- `[RunPod] Creating nocturne-swe from Modelfile...`
- `[RunPod] Model nocturne-swe ready`

Om du ser fel:
- **"Model not found"** → Basmodellen laddas fortfarande ner
- **"Modelfile not found"** → Modelfile är inte kopierad till Docker image
- **"Permission denied"** → Ollama har inte rättigheter att skapa modeller

---

## ✅ Checklista

- [ ] Modelfile kopierad till `gpt-relay-server/Modelfile`
- [ ] Dockerfile uppdaterad att inkludera Modelfile
- [ ] handler.py uppdaterad att skapa modellen
- [ ] Pushat till GitHub
- [ ] RunPod endpoint uppdaterad
- [ ] Väntat på build (5-10 min första gången)
- [ ] Testat från lokal server

