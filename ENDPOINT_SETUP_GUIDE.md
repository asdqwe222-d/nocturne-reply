# 🎯 RunPod Endpoint Setup Guide

## Du har skapat en ny endpoint - här är vad du behöver göra:

---

## Steg 1: Koppla GitHub till RunPod (Om inte redan gjort)

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

## Steg 2: Konfigurera din Endpoint

### Om du redan skapat endpointen:

1. **Gå till din endpoint**
   - RunPod Dashboard → **Serverless** → Klicka på din endpoint

2. **Klicka på "Edit" eller "Settings"**
   - Leta efter en knapp för att redigera konfigurationen

3. **Uppdatera följande:**

   **Repository Settings:**
   - **Repository:** `asdqwe222-d/nocturne-reply`
   - **Branch:** `main`
   - **Dockerfile Path:** `Dockerfile` (finns i root)
   - **Handler Path:** `handler.py` (finns i root)

   **Container Configuration:**
   - **Container Start Command:** `python /app/handler.py`
   - **Container Disk:** `10 GB` (eller minst 5 GB)
   - **Expose HTTP Ports:** `11434`

   **Environment Variables:**
   ```
   OLLAMA_MODEL=nocturne-swe
   OLLAMA_HOST=0.0.0.0:11434
   ```

   **GPU & Worker:**
   - **GPU Type:** A40 eller RTX 3090
   - **Worker Type:** Flex (pay-per-use) eller Active (always-on)

4. **Spara ändringar**

---

## Steg 3: Om du behöver skapa en ny endpoint från GitHub

Om din nuvarande endpoint inte stödjer GitHub-integration:

1. **Gå till Serverless → New Endpoint**

2. **Välj "Import Git Repository" tab**
   - Om du inte ser denna tab, leta efter dropdown eller alternativ högst upp
   - Välj **"Git Repository"** eller **"Import Git Repository"**

3. **Välj Repository:**
   - Repository: `asdqwe222-d/nocturne-reply`
   - Branch: `main`

4. **Konfigurera som ovan** (se Steg 2)

5. **Klicka "Create Endpoint"**

---

## Steg 4: Efter Endpoint är konfigurerad

1. **Vänta på build** (~2-5 minuter)
   - RunPod kommer automatiskt bygga Docker image från GitHub

2. **Kopiera Endpoint URL**
   - Format: `https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run`
   - Du hittar den i endpoint-detaljer

3. **Skapa API Key** (om du inte redan har)
   - Settings → API Keys → Create API Key
   - Kopiera och spara den

4. **Uppdatera `.env` fil:**
   ```bash
   RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
   RUNPOD_API_KEY=your-api-key-here
   USE_RUNPOD=true
   ```

---

## Viktiga Inställningar Sammanfattning

| Setting | Value |
|---------|-------|
| Repository | `asdqwe222-d/nocturne-reply` |
| Branch | `main` |
| Dockerfile Path | `Dockerfile` |
| Handler Path | `handler.py` |
| Container Start Command | `python /app/handler.py` |
| Container Disk | `10 GB` |
| HTTP Ports | `11434` |
| Environment Variables | `OLLAMA_MODEL=nocturne-swe`<br>`OLLAMA_HOST=0.0.0.0:11434` |

---

## Troubleshooting

### "Repository not found"
- Kolla att GitHub är kopplad i Settings → Connections
- Verifiera att repo-namnet är korrekt: `asdqwe222-d/nocturne-reply`

### "Dockerfile not found"
- Kolla att Dockerfile finns i repo-root (inte i `gpt-relay-server/`)
- Verifiera Dockerfile Path är `Dockerfile` (inte `gpt-relay-server/Dockerfile`)

### "Handler not found"
- Kolla att handler.py finns i repo-root
- Verifiera Handler Path är `handler.py`

---

**Efter konfiguration: Rebuild endpoint och vänta på att builden lyckas!** 🚀

