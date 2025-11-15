# 🎉 Efter Deploy - Nästa Steg

## Vad händer nu?

Efter att du klickat "Next" och deployat endpointen:

1. **RunPod bygger endpointen** (~2-5 minuter)
2. **Ollama worker startar**
3. **Modellen `nocturne-swe` laddas** (första gången kan ta tid)
4. **Endpoint blir "Ready" eller "Active"**

---

## Steg 1: Vänta på att endpoint är klar

- Status ändras från "Building" → "Ready" eller "Active"
- Detta kan ta 2-10 minuter beroende på om modellen behöver laddas ner

---

## Steg 2: Kopiera Endpoint URL

När endpoint är klar:

1. **Gå till din endpoint** i RunPod Dashboard
2. **Kopiera Endpoint URL**
   - Format: `https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run`
   - Den finns i endpoint-detaljer eller "API" tab

---

## Steg 3: Skapa API Key (Om du inte redan har)

1. **Gå till RunPod Dashboard → Settings → API Keys**
2. **Klicka "Create API Key"**
3. **Ge den ett namn:** `nocturne-serverless`
4. **Kopiera API key** (du ser den bara en gång!)

---

## Steg 4: Uppdatera `.env` fil

Öppna `gpt-relay-server/.env` och lägg till/uppdatera:

```bash
# RunPod Serverless Configuration
RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
RUNPOD_API_KEY=your-api-key-here
USE_RUNPOD=true
```

**Ersätt:**
- `YOUR_ENDPOINT_ID` med ditt faktiska endpoint ID från URL:en
- `your-api-key-here` med din faktiska API key

---

## Steg 5: Testa Endpoint

### Option A: Testa från din server

```bash
cd gpt-relay-server
node server.js
```

Sedan testa från userscript eller via `http://localhost:3000/test-chat.html`

### Option B: Testa direkt från RunPod

1. Gå till din endpoint i RunPod Dashboard
2. Klicka "Test" eller "API" tab
3. Skicka en test-request

---

## Steg 6: Uppdatera Userscript (Om behövs)

Om din userscript (`tm-explicit-replies.user.js`) behöver uppdateras:

1. **Kontrollera att RunPod mode är aktiverat**
2. **Verifiera att Endpoint URL och API Key är korrekta**
3. **Testa att generera replies**

---

## Troubleshooting

### Endpoint är inte "Ready"

- Vänta längre (modell-laddning kan ta tid)
- Kolla build logs för fel
- Verifiera att modell-namnet är korrekt

### Modellen laddas inte

- Kontrollera att `nocturne-swe` finns i Ollama's registry
- Om inte, använd en annan modell (t.ex. `llama3`, `mistral`)
- Eller pusha din modell till Ollama först

### API-anrop fungerar inte

- Verifiera Endpoint URL är korrekt
- Verifiera API Key är korrekt
- Kolla endpoint logs i RunPod Dashboard

---

## Sammanfattning - Checklista

- [ ] Endpoint är deployad och "Ready"
- [ ] Endpoint URL kopierad
- [ ] API Key skapad och kopierad
- [ ] `.env` fil uppdaterad med URL och API key
- [ ] Server startad (`node server.js`)
- [ ] Testat att generera replies

---

**Efter deploy: Kopiera Endpoint URL och API Key, uppdatera `.env`, och testa!** 🚀

