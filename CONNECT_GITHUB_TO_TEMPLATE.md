# 🔗 Koppla GitHub Repository till RunPod Hub Template

## Hur Det Fungerar

När du använder en RunPod Hub template **OCH** kopplar din GitHub repository:
- ✅ RunPod bygger från din `Dockerfile`
- ✅ RunPod kör din `handler.py`
- ✅ Du kan skapa din anpassade modell automatiskt!

---

## Steg 1: Verifiera att Din Kod är på GitHub

1. **Gå till:** https://github.com/asdqwe222-d/nocturne-reply
2. **Kontrollera att du ser:**
   - ✅ `Dockerfile` (med `COPY Modelfile`)
   - ✅ `handler.py` (med `create_model_from_modelfile`)
   - ✅ `Modelfile`
   - ✅ `.runpod/hub.json` (med `"repository": "https://github.com/asdqwe222-d/nocturne-reply"`)

---

## Steg 2: Koppla GitHub Repository i RunPod

### Option A: När Du Skapar Ny Endpoint från Template

1. **Gå till RunPod Hub:**
   - https://console.runpod.io/hub/SvenBrnn/runpod-worker-ollama
   - Eller RunPod Dashboard → Hub → Sök "Ollama"

2. **Klicka "Deploy" eller "Use Template"**

3. **I konfigurationsdialogen, leta efter:**
   - **"GitHub Repository"** fält
   - Eller **"Source"** dropdown med alternativ för "Template" vs "GitHub"
   - Eller **"Customize"** knapp som låter dig välja GitHub repo

4. **Välj eller ange:**
   - Repository: `asdqwe222-d/nocturne-reply`
   - Branch: `main`

5. **Konfigurera Environment Variables:**
   ```
   OLLAMA_MODEL_NAME=nocturne-swe
   ```

6. **Klicka "Deploy"**

### Option B: Redigera Befintlig Endpoint

1. **Gå till RunPod Dashboard → Edit Endpoint**

2. **Hitta "Docker Configuration" sektion**

3. **Leta efter "Container Image" eller "Source" fält**

4. **Ändra från template image till GitHub:**
   - Välj "GitHub Repository" istället för "Template"
   - Repository: `asdqwe222-d/nocturne-reply`
   - Branch: `main`

5. **Spara Endpoint**

---

## Steg 3: Vänta på Build

RunPod kommer nu:
1. ✅ Klona din GitHub repository
2. ✅ Bygga Docker image från din `Dockerfile`
3. ✅ Köra din `handler.py` som skapar modellen automatiskt

**Första körningen tar 5-10 minuter** eftersom:
- Docker image byggs (~2 min)
- Ollama startar (~30 sek)
- Pullar basmodell `mistral-nemo:12b-instruct-2407-q4_K_M` (~7GB, 5-8 min)
- Skapar `nocturne-swe` från Modelfile (~30 sek)

---

## Steg 4: Verifiera i Logs

När endpoint är "Ready", gå till **Logs** och leta efter:

```
[RunPod] Checking if model nocturne-swe exists...
[RunPod] Model nocturne-swe not found, creating from Modelfile...
[RunPod] Pulling base model: mistral-nemo:12b-instruct-2407-q4_K_M
[RunPod] Base model pulled successfully
[RunPod] Creating nocturne-swe from Modelfile...
[RunPod] Model nocturne-swe created successfully
```

---

## ⚠️ Om Du Inte Ser GitHub-alternativet

Om RunPod Hub template inte visar GitHub-alternativet direkt:

### Alternativ 1: Skapa Endpoint från GitHub Direkt

1. **Gå till RunPod Dashboard → Serverless → New Endpoint**
2. **Välj "Import Git Repository" tab** (istället för "Templates")
3. **Ange:**
   - Repository: `asdqwe222-d/nocturne-reply`
   - Branch: `main`
4. **Konfigurera som vanligt**

### Alternativ 2: Fork Template och Lägg Till Din Kod

1. **Fork template's GitHub repo** (om det finns)
2. **Lägg till din Dockerfile och handler.py**
3. **Push till ditt fork**
4. **Använd ditt fork i RunPod**

---

## ✅ Checklista

- [ ] Kod är pushad till GitHub
- [ ] `Dockerfile` inkluderar `COPY Modelfile`
- [ ] `handler.py` har `create_model_from_modelfile` funktion
- [ ] `.runpod/hub.json` har rätt repository URL
- [ ] GitHub är kopplad till RunPod (Settings → Connections)
- [ ] Endpoint är konfigurerad att använda GitHub repo
- [ ] Väntat på build (5-10 min första gången)
- [ ] Verifierat i logs att modellen skapas
- [ ] Testat från lokal server

---

## 🎯 Sammanfattning

**Du HAR rätt:** RunPod Hub templates KAN använda GitHub repositories!

När du kopplar din GitHub repo till template:
- ✅ RunPod bygger från din Dockerfile
- ✅ Din handler.py körs
- ✅ Din modell skapas automatiskt

**Nästa steg:** Koppla din GitHub repository i RunPod Dashboard när du skapar/redigerar endpoint!

