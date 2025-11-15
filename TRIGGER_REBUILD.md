# 🔄 Trigga RunPod Rebuild för Modellskapande

## ✅ Status

- ✅ Koden är pushad till GitHub
- ✅ `handler.py` har modellskapande-logik
- ✅ `Dockerfile` inkluderar Modelfile
- ✅ `Modelfile` finns i repo

**Men:** RunPod behöver bygga om endpointen för att använda den nya koden.

---

## 🎯 Steg 1: Verifiera att Koden är på GitHub

1. **Gå till:** https://github.com/asdqwe222-d/nocturne-reply
2. **Kontrollera att du ser:**
   - `Modelfile` finns i repo
   - `handler.py` har funktionen `create_model_from_modelfile`
   - `Dockerfile` har `COPY Modelfile /app/Modelfile`

---

## 🔄 Steg 2: Trigga RunPod Rebuild

### Option A: Via RunPod Dashboard (Rekommenderat)

1. **Gå till RunPod Dashboard**
2. **Välj din endpoint:** "Runpod Worker Ollama ollama@0.12.10"
3. **Klicka på "Releases" tab**
4. **Klicka "New Release"** eller **"Rebuild"**
5. **Vänta på att builden är klar** (5-10 minuter första gången)

### Option B: Via Endpoint Settings

1. **Gå till RunPod Dashboard**
2. **Välj din endpoint**
3. **Klicka "Edit Endpoint"**
4. **Ändra något litet** (t.ex. lägg till ett mellanslag i Environment Variable)
5. **Spara** - detta triggar en rebuild

### Option C: Pusha en ny commit (Om Option A/B inte fungerar)

```bash
cd gpt-relay-server
git commit --allow-empty -m "Trigger RunPod rebuild"
git push
```

---

## ⏱️ Steg 3: Vänta på Build

**Första körningen tar 5-10 minuter** eftersom:
1. ✅ Docker image byggs (~2 min)
2. ✅ Ollama startar (~30 sek)
3. ✅ Pullar basmodell `mistral-nemo:12b-instruct-2407-q4_K_M` (~7GB, 5-8 min)
4. ✅ Skapar `nocturne-swe` från Modelfile (~30 sek)

**Efter första körningen:** Modellen är cachad, startup är snabbare (~30 sek).

---

## 🔍 Steg 4: Kolla Logs

När endpoint är "Ready", gå till **Logs** tab och leta efter:

**✅ Om det fungerar:**
```
[RunPod] Checking if model nocturne-swe exists...
[RunPod] Model nocturne-swe not found, creating from Modelfile...
[RunPod] Pulling base model: mistral-nemo:12b-instruct-2407-q4_K_M
[RunPod] This may take 5-10 minutes on first run...
[RunPod] Base model pulled successfully
[RunPod] Creating nocturne-swe from Modelfile...
[RunPod] Model nocturne-swe created successfully
[RunPod] Model nocturne-swe is ready
```

**❌ Om det misslyckas:**
```
[RunPod] Error creating model: ...
```

---

## 🧪 Steg 5: Testa

När endpoint är "Ready" och logs visar att modellen är skapad:

```bash
cd gpt-relay-server
node server.js
```

Testa från `http://localhost:3000/test-chat.html`

---

## ⚠️ Viktigt

**Om du använder RunPod Hub Template:**
- RunPod Hub templates kan ha sin egen build-process
- Du kan behöva **skapa en ny endpoint** istället för att uppdatera den gamla
- Eller kontakta RunPod support för att trigga rebuild

**Om rebuild inte triggas automatiskt:**
- Skapa en ny endpoint från GitHub repo
- Eller använd RunPod API för att trigga rebuild programmatiskt

---

## 📋 Checklista

- [ ] Verifierat att koden är på GitHub
- [ ] Triggar rebuild i RunPod Dashboard
- [ ] Väntar på build (5-10 min första gången)
- [ ] Kollar logs för modellskapande-meddelanden
- [ ] Testar från lokal server
- [ ] Verifierar att requests fungerar

