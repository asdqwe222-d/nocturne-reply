# 🚀 Starta Om - Enkel Guide från Början

## Mål

Köra din anpassade `nocturne-swe` modell på RunPod Serverless.

---

## Steg 1: Verifiera Din Kod Lokalt

### 1.1 Kontrollera Filer

Se till att du har dessa filer i `gpt-relay-server/`:

```
gpt-relay-server/
├── handler.py          ✅ (skapar modellen automatiskt)
├── Dockerfile          ✅ (inkluderar Modelfile)
├── Modelfile           ✅ (din anpassade modell)
├── requirements.txt    ✅
└── .runpod/
    └── hub.json       ✅
```

### 1.2 Testa Lokalt Först

```bash
cd gpt-relay-server
node server.js
```

Testa från `http://localhost:3000/test-chat.html` med lokal Ollama.

**Om detta fungerar lokalt:** Fortsätt till Steg 2.
**Om detta inte fungerar:** Fixa lokalt först.

---

## Steg 2: Pusha Allt till GitHub

### 2.1 Kontrollera Git Status

```bash
cd gpt-relay-server
git status
```

### 2.2 Lägg Till Alla Filer

```bash
git add .
git commit -m "Ready for RunPod deployment"
git push
```

### 2.3 Verifiera på GitHub

Gå till: https://github.com/asdqwe222-d/nocturne-reply

Kontrollera att du ser:
- ✅ `handler.py`
- ✅ `Dockerfile`
- ✅ `Modelfile`
- ✅ `requirements.txt`

---

## Steg 3: Skapa RunPod Endpoint från GitHub

### 3.1 Gå till RunPod Dashboard

1. **Gå till:** https://console.runpod.io/serverless
2. **Klicka:** "New Endpoint"

### 3.2 Välj "Import Git Repository"

**VIKTIGT:** Välj **"Import Git Repository"** tab, INTE "Templates"!

### 3.3 Konfigurera Repository

- **Repository:** `asdqwe222-d/nocturne-reply`
- **Branch:** `main`

### 3.4 Docker Configuration

**Container Start Command:**
```
sh -c "ollama serve & sleep 5 && python /app/handler.py"
```

**Container Disk:** `20 GB` (modellen behöver plats)

**Expose HTTP Ports:** `11434`

### 3.5 Environment Variables

Lägg till:
```
OLLAMA_MODEL=nocturne-swe
OLLAMA_HOST=0.0.0.0:11434
```

### 3.6 GPU & Workers

- **GPU Type:** RTX 3090 eller A40 (24GB+)
- **Max Workers:** 2
- **Active Workers:** 0 (för test)
- **Idle Timeout:** 5 sek

### 3.7 Skapa Endpoint

Klicka **"Create Endpoint"** eller **"Deploy"**

---

## Steg 4: Vänta på Build

### 4.1 Build Process

RunPod kommer:
1. ✅ Klona din GitHub repo
2. ✅ Bygga Docker image från Dockerfile
3. ✅ Starta containern

**Detta tar 2-5 minuter.**

### 4.2 Första Körning (När Worker Startar)

När worker startar första gången:
1. ✅ Ollama startar
2. ✅ Pullar basmodell `mistral-nemo:12b-instruct-2407-q4_K_M` (~7GB, 5-10 min)
3. ✅ Skapar `nocturne-swe` från Modelfile (~30 sek)

**Total tid första gången: 10-15 minuter.**

---

## Steg 5: Verifiera i Logs

### 5.1 Gå till Logs

1. **RunPod Dashboard → Din Endpoint**
2. **Klicka "Logs" tab**

### 5.2 Leta Efter

Du bör se:
```
[RunPod] Checking if model nocturne-swe exists...
[RunPod] Model nocturne-swe not found, creating from Modelfile...
[RunPod] Pulling base model: mistral-nemo:12b-instruct-2407-q4_K_M
[RunPod] Base model pulled successfully
[RunPod] Creating nocturne-swe from Modelfile...
[RunPod] Model nocturne-swe created successfully
[RunPod] Model nocturne-swe is ready
```

### 5.3 Om Du Ser Fel

**"Model not found":** Modellen skapas fortfarande, vänta lite till.

**"Modelfile not found":** Kontrollera att Modelfile är pushad till GitHub.

**"Failed to pull base model":** Nätverksproblem, försök igen senare.

---

## Steg 6: Testa från Din Server

### 6.1 Uppdatera `.env`

Öppna `gpt-relay-server/.env`:

```bash
USE_RUNPOD=true
RUNPOD_ENDPOINT_URL=https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run
RUNPOD_API_KEY=your_api_key_here
OLLAMA_MODEL=nocturne-swe
```

### 6.2 Starta Server

```bash
cd gpt-relay-server
node server.js
```

### 6.3 Testa

Gå till: `http://localhost:3000/test-chat.html`

Klicka "Generate" och vänta på svar.

---

## Steg 7: Felsökning

### Problem: "Model not found"

**Lösning:** Vänta längre. Första körningen tar 10-15 minuter.

### Problem: "Build failed"

**Lösning:** 
1. Kolla RunPod logs för felmeddelande
2. Verifiera att alla filer är pushade till GitHub
3. Kontrollera Dockerfile syntax

### Problem: "Empty response"

**Lösning:**
1. Kolla RunPod logs
2. Verifiera att modellen är skapad
3. Testa med en enklare prompt först

---

## ✅ Checklista

- [ ] Kod fungerar lokalt
- [ ] Alla filer pushade till GitHub
- [ ] Endpoint skapad från GitHub repo
- [ ] Environment variables konfigurerade
- [ ] Väntat på build (2-5 min)
- [ ] Väntat på första körning (10-15 min)
- [ ] Verifierat i logs att modellen skapas
- [ ] `.env` uppdaterad med RunPod credentials
- [ ] Testat från lokal server
- [ ] Det fungerar! 🎉

---

## 🎯 Snabb Start

**Om du vill gå snabbt:**

1. **Pusha till GitHub:**
   ```bash
   cd gpt-relay-server
   git add .
   git commit -m "Deploy"
   git push
   ```

2. **Skapa Endpoint:**
   - RunPod Dashboard → New Endpoint
   - Import Git Repository → `asdqwe222-d/nocturne-reply`
   - Konfigurera som ovan
   - Skapa

3. **Vänta 15 minuter** (första gången)

4. **Testa!**

---

**Låt oss börja om från början med denna guide!** 🚀

