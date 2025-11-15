# ⚡ Snabb Fix för RunPod Hub Template

## Problem

Du använder RunPod Hub template som inte kan ändras direkt. Modellen `nocturne-swe` finns inte i Ollama's registry.

---

## ✅ Snabb Fix: Använd Standardmodell

### Steg 1: Ändra RunPod Endpoint

1. **Gå till RunPod Dashboard → Edit Endpoint**
2. **Hitta Environment Variables**
3. **Ändra `OLLAMA_MODEL_NAME`:**
   ```
   OLLAMA_MODEL_NAME=llama3
   ```
   (eller `mistral`, `llama3.2`, `phi3`)

4. **Spara Endpoint**

### Steg 2: Uppdatera Lokal `.env`

Öppna `gpt-relay-server/.env` och ändra:

```bash
OLLAMA_MODEL=llama3
```

### Steg 3: Testa

```bash
cd gpt-relay-server
node server.js
```

Testa från `http://localhost:3000/test-chat.html`

**Detta fungerar direkt!** 🎉

---

## 🔄 Senare: För Din Anpassade Modell

För att använda `nocturne-swe` med RunPod Hub template behöver du:

### Option A: Bygg Egen Docker Image

1. **Bygg Docker image** med din Dockerfile som skapar modellen
2. **Push till RunPod Registry** eller Docker Hub
3. **Använd din image** i RunPod istället för template

### Option B: Använd Standardmodell + System Prompt

Du kan skicka system prompten direkt i din request istället för att ha den i Modelfile. Detta fungerar med standardmodeller!

---

## 🎯 Rekommendation Nu

**Använd `llama3` för att få det att fungera NU.**

**Senare:** Bygg egen Docker image för din anpassade modell.

