# 🎯 RunPod Setup: Steg-för-Steg Guide

## ✅ Steg 1: Endpoint Configuration (Du är här nu!)

### Endpoint Name:
- ✅ `nocturne-reply` (eller ändra till `nocturne-ollama` om du vill)

### Endpoint Type:
- ✅ **Queue** (korrekt valt - perfekt för vår use case)

### Worker Type:
- ✅ **GPU** (korrekt valt)

### GPU Configuration:
- ✅ **48 GB** (detta är förmodligen A40 - perfekt för större modeller!)
- ✅ **1st** (första prioriteten)
- ✅ Kostnad: `$0.00034/s` (~$0.02/minut, ~$1.22/timme)

**OBS:** Om du vill spara pengar kan du välja en mindre GPU (t.ex. RTX 3090 med 24 GB), men 48 GB är bra för större modeller.

---

## 📋 Steg 2: Klicka "Next" eller "Continue"

Efter att du har valt GPU-konfiguration, klicka på **"Next"** eller **"Continue"** för att gå till nästa steg.

---

## 🔧 Steg 3: Container Configuration (Nästa sida)

På nästa sida kommer du se:

### Container Start Command:
Fyll i:
```bash
python /app/handler.py
```

### Container Disk:
- Ändra från 5 GB till **10 GB** (klicka på + tills det står 10 GB)
- Ollama och modeller behöver mer plats

### Expose HTTP Ports:
Fyll i:
```
11434
```

### Expose TCP Ports:
Lämna tomt (eller fyll i `11434` om det krävs)

---

## 🔐 Steg 4: Environment Variables

Klicka för att expandera "Environment Variables" och lägg till:

**Variable 1:**
- Key: `OLLAMA_MODEL`
- Value: `nocturne-swe`

**Variable 2:**
- Key: `OLLAMA_HOST`
- Value: `0.0.0.0:11434`

Klicka på **"+ Add Environment Variable"** för varje ny variabel.

---

## 🚀 Steg 5: Deploy

När allt är ifyllt:
1. Klicka på **"Deploy Endpoint"** eller **"Create"**
2. Vänta på build (2-5 minuter)
3. Du kommer se build-loggar
4. När status är "Ready", kopiera **Endpoint URL**

---

## 📝 Steg 6: Kopiera Endpoint URL och API Key

### Endpoint URL:
Format: `https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run`

### API Key:
1. Gå till RunPod Dashboard → **Settings** → **API Keys**
2. Klicka på **"Create API Key"**
3. Kopiera nyckeln direkt (den visas bara en gång!)

---

## ⚙️ Steg 7: Uppdatera `.env`

Öppna `gpt-relay-server/.env` och lägg till:

```bash
# RunPod Serverless Configuration
RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
RUNPOD_API_KEY=your-api-key-here

# Hybrid mode (rekommenderat)
USE_RUNPOD=false
RUNPOD_FALLBACK=true
```

---

## ✅ Checklista

- [x] Repository valt: `asdqwe222-d/nocturne-reply`
- [x] Endpoint Type: Queue
- [x] Worker Type: GPU
- [x] GPU: 48 GB valt
- [ ] Container Start Command: `python /app/handler.py`
- [ ] Container Disk: 10 GB
- [ ] HTTP Ports: 11434
- [ ] Environment Variables: `OLLAMA_MODEL=nocturne-swe`, `OLLAMA_HOST=0.0.0.0:11434`
- [ ] Endpoint deployad
- [ ] Endpoint URL kopierad
- [ ] API Key skapad och kopierad
- [ ] `.env` uppdaterad

---

## 💡 Tips

- **GPU-val:** 48 GB (A40) är bra för större modeller. Om du bara kör 12B-modeller kan du välja 24 GB (RTX 3090) för att spara pengar.
- **Container Disk:** 10 GB är minimum. Om du ska köra flera modeller, överväg 20 GB.
- **Kostnad:** Med $0.00034/s blir det ~$0.02 per minut. En generation tar ~5 sekunder = ~$0.002 per generation.

---

**Nästa:** Klicka "Next" och fyll i Container Configuration!

