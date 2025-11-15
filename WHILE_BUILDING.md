# ⏳ Medan Endpoint Bygger

## Vad händer nu?

RunPod bygger din Docker image från GitHub-repo:
1. ✅ Klonar `asdqwe222-d/nocturne-reply`
2. 🔄 Bygger Docker image från `Dockerfile`
3. 🔄 Installerar Ollama
4. 🔄 Installerar Python dependencies
5. 🔄 Konfigurerar handler

Detta tar vanligtvis **2-5 minuter**.

---

## 📋 Medan du väntar: Förbered nästa steg

### Steg 1: Skapa RunPod API Key

1. **Öppna ny flik** i webbläsaren
2. Gå till RunPod Dashboard: https://www.runpod.io
3. Klicka på din profil (högst upp till höger) → **Settings**
4. Välj **API Keys** i menyn
5. Klicka på **"Create API Key"**
6. **Kopiera nyckeln direkt** (den visas bara en gång!)
7. Spara den någonstans säkert (t.ex. i en textfil)

**OBS:** Du behöver denna nyckel för att ansluta din server till RunPod!

---

### Steg 2: Förbered `.env` filen

Öppna `gpt-relay-server/.env` i en texteditor.

Lägg till dessa rader (om de inte redan finns):

```bash
# RunPod Serverless Configuration
RUNPOD_ENDPOINT_URL=
RUNPOD_API_KEY=

# Hybrid mode (rekommenderat)
USE_RUNPOD=false
RUNPOD_FALLBACK=true
```

**Vi fyller i URL:en när builden är klar!**

---

## ✅ När builden är klar

### Steg 1: Kopiera Endpoint URL

1. Gå tillbaka till RunPod Dashboard → **Serverless**
2. Hitta din endpoint: `nocturne-reply`
3. Klicka på den
4. Kopiera **Endpoint URL**
   - Format: `https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run`
   - Den finns oftast högst upp på sidan eller under "Endpoint Details"

### Steg 2: Uppdatera `.env`

Öppna `gpt-relay-server/.env` och fyll i:

```bash
# RunPod Serverless Configuration
RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
RUNPOD_API_KEY=your-api-key-here

# Hybrid mode (rekommenderat)
USE_RUNPOD=false
RUNPOD_FALLBACK=true
```

**Ersätt:**
- `YOUR_ENDPOINT_ID` med det faktiska ID:et från URL:en
- `your-api-key-here` med API-nyckeln du kopierade tidigare

---

## 🧪 Steg 3: Testa Endpoint

### Test från RunPod Dashboard:

1. I RunPod Dashboard → Serverless → din endpoint
2. Klicka på **"Test"** eller **"Test Endpoint"**
3. Använd test-input:
```json
{
  "input": {
    "model": "nocturne-swe",
    "prompt": "Say hello in Swedish",
    "system": "You are a helpful assistant.",
    "stream": false,
    "options": {
      "temperature": 0.7,
      "num_predict": 50
    }
  }
}
```

4. Klicka **"Run"** eller **"Send"**
5. Du bör få ett svar tillbaka!

---

## 🚀 Steg 4: Testa från din server

### Starta servern:

```bash
cd C:\Users\Oliwer\Desktop\Cursor\Nocturne\gpt-relay-server
npm start
```

### Kontrollera loggarna:

Du bör se något liknande:

```
🌐 RunPod Serverless: ENABLED (fallback mode)
   Endpoint: https://api.runpod.io/v2/...
   Will fallback to RunPod if local Ollama fails
```

### Testa genom att generera ett svar:

1. Öppna din Tampermonkey script på en test-sida
2. Skriv ett meddelande i chatten
3. Klicka på "Generate" eller tryck Ctrl+Enter
4. Om lokal Ollama inte fungerar, ska den automatiskt fallback till RunPod!

---

## 🔧 Troubleshooting

### Problem: Build failed

**Kontrollera:**
- Build-loggar i RunPod Dashboard
- Verifiera att `Dockerfile` finns i repo
- Kontrollera att `handler.py` finns
- Se till att `requirements.txt` finns

**Vanliga fel:**
- "Dockerfile not found" → Kontrollera att Dockerfile är i `gpt-relay-server/` mappen
- "Handler not found" → Kontrollera att handler.py finns
- "Build timeout" → Försök igen, kan vara temporärt

### Problem: Endpoint URL inte synlig

**Lösning:**
- Gå till Serverless → din endpoint
- Klicka på endpoint-namnet
- Endpoint URL finns under "Endpoint Details" eller högst upp

### Problem: API Key saknas

**Lösning:**
- Settings → API Keys → Create API Key
- Kopiera direkt (visas bara en gång!)

---

## 📋 Checklista

- [ ] API Key skapad och kopierad
- [ ] `.env` förberedd (tomma värden)
- [ ] Build klar (status: "Ready")
- [ ] Endpoint URL kopierad
- [ ] `.env` uppdaterad med URL och API key
- [ ] Server startad
- [ ] Test-körning genomförd

---

## 🎉 När allt är klart!

Din server kommer nu automatiskt använda RunPod om lokal Ollama inte fungerar!

**Nästa:** Testa genom att generera några svar och se att RunPod används när lokal Ollama inte är tillgänglig.

