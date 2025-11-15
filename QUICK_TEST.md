# ⚡ Snabb Test - RunPod Endpoint

## Problem: Logs är tomma, kan inte testa från Dashboard

**Lösning:** Testa från din egen server istället!

---

## Steg 1: Verifiera .env

Öppna `gpt-relay-server/.env` och kontrollera:

```bash
RUNPOD_ENDPOINT_URL=https://api.runpod.ai/v2/kjuxscfof20t8h/run
RUNPOD_API_KEY=din-api-key-här
USE_RUNPOD=true
OLLAMA_MODEL=nocturne-swe
```

**VIKTIGT:** Om `nocturne-swe` inte finns i RunPod, ändra till:

```bash
OLLAMA_MODEL=llama3
```

---

## Steg 2: Starta Servern

```bash
cd gpt-relay-server
node server.js
```

Du bör se:
```
🌐 RunPod Serverless: ENABLED
   Endpoint: https://api.runpod.ai/v2/kjuxscfof20t8h/run...
```

---

## Steg 3: Testa Generation

1. Öppna: `http://localhost:3000/test-chat.html`
2. Skriv ett meddelande
3. Klicka "Generate"

---

## Steg 4: Kolla Terminal Logs

**Om det fungerar:**
```
[Nocturne] Calling RunPod Serverless...
[RunPod] Calling serverless endpoint: https://api.runpod.ai/v2/...
[RunPod] Full response: {...}
[RunPod] Response received, length: XXX
```

**Om det misslyckas:**
```
[RunPod] API error: 500
[RunPod] Error details: {...}
```

**Kopiera dessa logs och skicka hit!**

---

## Om Modellen Inte Finns

Om du ser `Model not found`:

1. Ändra i `.env`: `OLLAMA_MODEL=llama3`
2. Starta om servern
3. Testa igen

---

## Nästa Steg

1. ✅ Starta servern
2. ✅ Testa generation
3. ✅ Kopiera logs från terminalen
4. ✅ Skicka logs hit så kan jag hjälpa dig fixa!

