# ⚙️ RunPod Endpoint Konfiguration Guide

## Vad du ser i Edit Endpoint-dialogen

### ✅ Redan Konfigurerat (Bra!)

1. **Environment Variables:**
   - `OLLAMA_MODEL_NAME=nocturne-swe` ✅
   - `MAX_CONCURRENCY=8` ✅
   - `OLLAMA_NUM_PARALLEL=4` ✅

2. **GPU Configuration:**
   - 16 GB, 24 GB, 24 GB Pro valda ✅
   - Max Workers: 2 ✅
   - Idle Timeout: 5 sec ✅
   - Execution Timeout: 600 sec (10 min) ✅
   - FlashBoot: Enabled ✅

3. **Container Image:**
   - `registry.runpod.net/svenbrnn-runpod-worker-ollama-master-dockerfile:672b233f8` ✅

---

## ⚠️ Viktigt: Model-fältet

**"Model" fältet är tomt** - detta är för Hugging Face models, inte Ollama models.

**Du behöver INTE fylla i detta fält!** Ollama-modellen anges via `OLLAMA_MODEL_NAME` environment variable (som redan är satt till `nocturne-swe`).

---

## ✅ Spara Endpoint

1. **Klicka "Save Endpoint"** längst ner
2. Vänta på att endpointen uppdateras (~30 sekunder)

---

## 🧪 Efter Sparning: Testa

### Steg 1: Verifiera att endpoint är "Ready"

Gå tillbaka till Overview och kontrollera att status är "Ready".

### Steg 2: Testa från din server

```bash
cd gpt-relay-server
node server.js
```

Sedan testa från `http://localhost:3000/test-chat.html`

### Steg 3: Kolla logs

I terminalen där `node server.js` körs, leta efter:

**Om det fungerar:**
```
[Nocturne] Calling RunPod Serverless...
[RunPod] Full response: {...}
[RunPod] Response received, length: XXX
```

**Om modellen inte finns:**
```
[RunPod] Error: Model not found
```

Om du ser "Model not found", ändra `OLLAMA_MODEL_NAME` till `llama3` istället.

---

## 🔧 Om Modellen Inte Finns

Om `nocturne-swe` inte finns i Ollama-containern:

1. **Gå tillbaka till Edit Endpoint**
2. **Ändra Environment Variable:**
   - `OLLAMA_MODEL_NAME=llama3` (eller `mistral`, `llama3.2`, etc.)
3. **Spara**
4. **Uppdatera din `.env` fil:**
   ```bash
   OLLAMA_MODEL=llama3
   ```

---

## 📝 Sammanfattning

1. ✅ **Spara Endpoint** (klicka "Save Endpoint")
2. ✅ **Vänta på "Ready" status**
3. ✅ **Testa från din server**
4. ✅ **Kolla logs för fel**

**Model-fältet kan vara tomt - det är okej!**

