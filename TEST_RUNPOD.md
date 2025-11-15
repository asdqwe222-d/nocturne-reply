# 🧪 Testa RunPod Endpoint

## Problem: Logs är tomma och kan inte testa från Dashboard

Detta är normalt - RunPod Hub Ollama Worker kanske inte visar logs direkt i Dashboard.

## Lösning: Testa från din server istället

### Steg 1: Verifiera .env konfiguration

Öppna `gpt-relay-server/.env` och kontrollera:

```bash
RUNPOD_ENDPOINT_URL=https://api.runpod.ai/v2/kjuxscfof20t8h/run
RUNPOD_API_KEY=your-api-key-here
USE_RUNPOD=true
OLLAMA_MODEL=nocturne-swe
```

**VIKTIGT:** Om `nocturne-swe` inte finns i RunPod containern, ändra till en modell som finns:

```bash
OLLAMA_MODEL=llama3
```

### Steg 2: Starta servern med logging

```bash
cd gpt-relay-server
node server.js
```

Du bör se:
```
RunPod Serverless: Enabled
   Endpoint: https://api.runpod.ai/v2/kjuxscfof20t8h/run...
```

### Steg 3: Testa att generera replies

1. Öppna `http://localhost:3000/test-chat.html`
2. Skriv ett meddelande
3. Klicka "Generate"

### Steg 4: Kolla server logs

I terminalen där `node server.js` körs, leta efter:

**Om det fungerar:**
```
[Nocturne] Calling RunPod Serverless...
[RunPod] Calling serverless endpoint: https://api.runpod.ai/v2/...
[RunPod] Model: nocturne-swe
[RunPod] Full response: {...}
[RunPod] Found output.response
[RunPod] Response received, length: XXX
```

**Om det misslyckas:**
```
[RunPod] API error: 500
[RunPod] Error details: {...}
[RunPod] Request body was: {...}
```

### Steg 5: Om modellen inte finns

Om du ser `Model not found` eller liknande:

**Option A: Använd en känd modell**
1. Ändra i `.env`: `OLLAMA_MODEL=llama3`
2. Starta om servern
3. Testa igen

**Option B: Pulla modellen i RunPod**
- Detta kräver att du har SSH-åtkomst eller kan köra kommandon i containern
- RunPod Hub Ollama Worker kanske inte stödjer detta direkt

### Steg 6: Testa med curl (alternativ)

Om servern inte fungerar, testa direkt:

```bash
curl -X POST https://api.runpod.ai/v2/kjuxscfof20t8h/run \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{
    "input": {
      "model": "llama3",
      "prompt": "Hello, this is a test",
      "system": "You are helpful.",
      "stream": false
    }
  }'
```

**Ersätt:**
- `kjuxscfof20t8h` med ditt endpoint ID
- `YOUR_API_KEY` med din API key
- `llama3` med din modell (eller `nocturne-swe` om den finns)

---

## Vanliga Problem

### Problem: "Model not found"
**Lösning:** Ändra `OLLAMA_MODEL` i `.env` till `llama3` eller `mistral`

### Problem: "Empty response"
**Lösning:** Kolla `[RunPod] Full response:` i logs för att se vad som faktiskt returneras

### Problem: "Timeout"
**Lösning:** Request tar för lång tid - modellen kanske är för stor eller containern är långsam

### Problem: "API error: 500"
**Lösning:** Kolla `[RunPod] Error details:` i logs för att se vad RunPod säger

---

## Nästa Steg

1. **Starta servern:** `cd gpt-relay-server && node server.js`
2. **Testa generation:** Från test-chat.html eller userscript
3. **Kopiera logs:** Från terminalen och skicka hit
4. **Om det inte fungerar:** Testa med `llama3` istället för `nocturne-swe`

