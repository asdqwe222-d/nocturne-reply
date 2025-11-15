# 🚀 Nästa Steg: Koppla GitHub till RunPod

## ✅ Steg 1: Koppla GitHub till RunPod

1. **Gå till RunPod Dashboard**
   - https://www.runpod.io
   - Logga in

2. **Öppna Settings**
   - Klicka på din profil (högst upp till höger)
   - Välj **"Settings"**

3. **Koppla GitHub**
   - I Settings, hitta **"Connections"** eller **"Integrations"**
   - Hitta **GitHub**-kortet
   - Klicka på **"Connect"** eller **"Authorize"**
   - Följ instruktionerna för att auktorisera RunPod
   - **Viktigt:** Välj att ge RunPod åtkomst till ditt repo `asdqwe222-d/nocturne-reply`

---

## ✅ Steg 2: Skapa Serverless Endpoint från GitHub

1. **Gå till Serverless**
   - I RunPod Dashboard, klicka på **"Serverless"** i menyn

2. **Skapa nytt Endpoint**
   - Klicka på **"New Endpoint"** eller **"Create Endpoint"**

3. **Välj "Import Git Repository"**
   - Du bör se flera alternativ: "Docker Image", "Import Git Repository", etc.
   - Välj **"Import Git Repository"**

4. **Välj ditt repository**
   - I dropdown-menyn, välj: `asdqwe222-d/nocturne-reply`
   - **Branch:** `main` (eller `master` om det är standard)
   - **Optional:** Välj release/tag om du har skapat en

---

## ✅ Steg 3: Konfigurera Endpoint

### Basic Settings:
- **Endpoint Name:** `nocturne-ollama` (eller valfritt namn)
- **GPU Type:** 
  - **A40** (för större modeller, 70B+) - ~$0.00029/sekund
  - **RTX 3090** (för mindre modeller, 12B) - ~$0.00019/sekund
- **Worker Type:**
  - **Flex** (pay-per-use, rekommenderat för test)
  - **Active** (alltid på, 20-30% rabatt, bättre för produktion)

### Build Settings:
- **Dockerfile Path:** `gpt-relay-server/Dockerfile` (eller bara `Dockerfile` om den är i root)
- **Handler Path:** `gpt-relay-server/handler.py` (eller bara `handler.py` om den är i root)

**OBS:** Om din Dockerfile och handler.py är i `gpt-relay-server/` mappen, måste du ange sökvägen korrekt!

### Environment Variables:
Lägg till dessa:
```
OLLAMA_MODEL=nocturne-swe
OLLAMA_HOST=0.0.0.0:11434
```

### Advanced Settings (Optional):
- **Container Disk:** 10 GB (standard)
- **Volume:** 0 GB (behövs inte för nu)
- **Ports:** 11434/http (redan konfigurerat i Dockerfile)

---

## ✅ Steg 4: Skapa och Vänta på Build

1. **Klicka på "Create Endpoint"**
2. **Vänta på build** (2-5 minuter)
   - Du kommer se build-loggar
   - Status kommer ändras från "Building" → "Ready"
3. **Kopiera Endpoint URL**
   - Format: `https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run`
   - Denna URL behöver du i nästa steg!

---

## ✅ Steg 5: Uppdatera `.env`

Öppna `gpt-relay-server/.env` och lägg till:

```bash
# RunPod Serverless Configuration
RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
RUNPOD_API_KEY=your-runpod-api-key-here

# Hybrid mode (rekommenderat)
USE_RUNPOD=false
RUNPOD_FALLBACK=true
```

**Var hittar jag API Key?**
1. RunPod Dashboard → Settings → API Keys
2. Klicka på "Create API Key"
3. Kopiera nyckeln direkt (den visas bara en gång!)

---

## ✅ Steg 6: Testa Endpoint

### 6.1 Testa från RunPod Dashboard

1. Gå till ditt endpoint i RunPod Dashboard
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

### 6.2 Testa från din server

Starta din server:
```bash
cd gpt-relay-server
npm start
```

Du bör se i loggarna:
```
🌐 RunPod Serverless: ENABLED (fallback mode)
   Endpoint: https://api.runpod.io/v2/...
   Will fallback to RunPod if local Ollama fails
```

---

## ✅ Steg 7: Testa Full Generation

1. Öppna din Tampermonkey script på en test-sida
2. Skriv ett meddelande i chatten
3. Klicka på "Generate" eller tryck Ctrl+Enter
4. Om lokal Ollama inte fungerar, ska den automatiskt fallback till RunPod!

---

## 🔧 Troubleshooting

### Problem: "Repository not found" i RunPod

**Lösning:**
- Kontrollera att GitHub är kopplat i RunPod Settings
- Verifiera att RunPod har åtkomst till `asdqwe222-d/nocturne-reply`
- Försök koppla om GitHub

### Problem: "Build failed"

**Lösning:**
- Kontrollera build-loggar i RunPod Dashboard
- Verifiera att Dockerfile finns i rätt mapp
- Kontrollera att `handler.py` finns
- Se till att `requirements.txt` finns

### Problem: "Handler not found"

**Lösning:**
- Kontrollera "Handler Path" i endpoint-konfigurationen
- Om filer är i `gpt-relay-server/`, använd: `gpt-relay-server/handler.py`
- Om filer är i root, använd: `handler.py`

### Problem: "Ollama model not found"

**Lösning:**
- Modellen `nocturne-swe` måste vara installerad i Ollama
- I Dockerfile, lägg till steg för att ladda ner modellen:
  ```dockerfile
  RUN ollama pull nocturne-swe
  ```
- Eller ändra `OLLAMA_MODEL` environment variable till en modell som finns

---

## 📋 Checklista

- [ ] GitHub kopplat till RunPod
- [ ] Endpoint skapad från GitHub repo
- [ ] Endpoint build klar (status: "Ready")
- [ ] Endpoint URL kopierad
- [ ] RunPod API Key skapad och kopierad
- [ ] `.env` uppdaterad med endpoint URL och API key
- [ ] Server startad och visar RunPod-konfiguration
- [ ] Test-körning genomförd

---

## 🎉 Klart!

När allt är klart kommer din server automatiskt använda RunPod om lokal Ollama inte fungerar!

**Nästa:** Testa genom att generera några svar och se att RunPod används när lokal Ollama inte är tillgänglig.

