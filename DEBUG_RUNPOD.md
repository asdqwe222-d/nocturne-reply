# 🔍 Debug RunPod Issues

## Problem: Request Failed

Om du ser "Failed: 1" i RunPod Dashboard, gör följande:

### 1. Kolla RunPod Logs

1. **Gå till din endpoint i RunPod Dashboard**
2. **Klicka på "Logs" tab**
3. **Leta efter felmeddelanden**

Vanliga fel:
- `Model not found` - Modellen `nocturne-swe` finns inte
- `Connection refused` - Ollama är inte startad
- `Timeout` - Request tog för lång tid

### 2. Testa Endpoint Direkt

I RunPod Dashboard → din endpoint → "Quick Start":

**Test Request:**
```json
{
  "input": {
    "model": "nocturne-swe",
    "prompt": "Hello, this is a test",
    "system": "You are a helpful assistant.",
    "stream": false,
    "options": {
      "temperature": 0.85,
      "top_p": 0.9,
      "repeat_penalty": 1.3,
      "num_ctx": 4096,
      "num_predict": 600
    }
  }
}
```

**Förväntat Response:**
```json
{
  "output": {
    "response": "Generated text here..."
  }
}
```

### 3. Verifiera Modell

RunPod Hub Ollama Worker behöver att modellen finns i Ollama.

**Om modellen inte finns:**
1. Modellen måste vara pullad i containern
2. Eller så måste du ändra till en modell som finns (t.ex. `llama3`, `mistral`)

**Testa med en känd modell:**
```json
{
  "input": {
    "model": "llama3",
    "prompt": "Hello",
    "system": "You are helpful.",
    "stream": false
  }
}
```

### 4. Kolla Server Logs

I din terminal där `node server.js` körs, leta efter:
- `[RunPod] Calling serverless endpoint:`
- `[RunPod] API error:`
- `[RunPod] Full response:`

Dessa logs visar exakt vad som händer.

### 5. Vanliga Problem och Lösningar

#### Problem: "Model not found"
**Lösning:** 
- Ändra modell i `.env` till en som finns (t.ex. `llama3`)
- Eller pulla modellen i RunPod containern

#### Problem: "Empty response"
**Lösning:**
- Kolla RunPod logs för att se vad som faktiskt returneras
- Response-formatet kan skilja sig - kolla `DEBUG_RUNPOD.md`

#### Problem: "Timeout"
**Lösning:**
- Öka timeout i `runpod-client.js` (default: 120 sekunder)
- Eller minska `num_predict` för snabbare generation

### 6. Testa Lokalt Först

Innan du använder RunPod, testa att lokal Ollama fungerar:

```bash
# Testa lokal Ollama
curl http://localhost:11434/api/generate -d '{
  "model": "nocturne-swe",
  "prompt": "Hello",
  "stream": false
}'
```

Om detta fungerar men RunPod inte gör det, är problemet i RunPod-konfigurationen.

---

**Nästa steg:** Kolla RunPod Logs och dela med dig av felmeddelandet!

