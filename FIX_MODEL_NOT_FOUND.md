# 🔧 Fix: Model Not Found Error

## Problem

Loggarna visar:
```
Error: pull model manifest: file does not exist
HTTP/1.1 404 Not Found
```

**Orsak:** `nocturne-swe` är en anpassad modell som inte finns i Ollama's modell-register. RunPod kan inte ladda ner den automatiskt.

---

## ✅ Lösning: Använd en Standardmodell

### Steg 1: Ändra RunPod Endpoint

1. **Gå till RunPod Dashboard → Edit Endpoint**
2. **Hitta Environment Variables**
3. **Ändra `OLLAMA_MODEL_NAME`:**
   ```
   OLLAMA_MODEL_NAME=llama3
   ```
   (eller `mistral`, `llama3.2`, `llama3.1`)

4. **Spara Endpoint**

---

### Steg 2: Uppdatera Lokal `.env` Fil

Öppna `gpt-relay-server/.env` och ändra:

```bash
# Ändra från:
OLLAMA_MODEL=nocturne-swe

# Till:
OLLAMA_MODEL=llama3
```

---

### Steg 3: Testa

```bash
cd gpt-relay-server
node server.js
```

Testa från `http://localhost:3000/test-chat.html`

---

## 📋 Tillgängliga Standardmodeller i Ollama

Dessa modeller finns automatiskt i Ollama och kan laddas ner av RunPod:

| Modell | Beskrivning | Storlek |
|--------|-------------|---------|
| `llama3` | Meta's Llama 3 (8B) | ~4.7GB |
| `llama3.1` | Llama 3.1 (8B) | ~4.7GB |
| `llama3.2` | Llama 3.2 (3B) | ~2GB |
| `mistral` | Mistral 7B | ~4.1GB |
| `mixtral` | Mixtral 8x7B | ~26GB |
| `phi3` | Microsoft Phi-3 | ~2.3GB |
| `gemma2` | Google Gemma 2 | ~5GB |

**Rekommendation:** Börja med `llama3` eller `mistral` - de är stabila och fungerar bra.

---

## 🔄 Alternativ: Ladda Upp Din Egen Modell (Avancerat)

Om du verkligen vill använda `nocturne-swe`:

1. **Skapa en Network Volume i RunPod**
2. **Ladda upp modellen till volymen**
3. **Konfigurera endpoint att använda volymen**

**Men detta är komplicerat och tar tid.** Det enklaste är att använda en standardmodell först.

---

## ✅ Efter Ändring

När du har ändrat modellen:

1. ✅ **RunPod endpoint är uppdaterad**
2. ✅ **Lokal `.env` är uppdaterad**
3. ✅ **Testa från din server**
4. ✅ **Kolla logs för bekräftelse**

Du bör se i logs:
```
[RunPod] Full response: {...}
[RunPod] Response received, length: XXX
```

Istället för:
```
Error: pull model manifest: file does not exist
```

---

## 🎯 Snabb Fix

**Kör detta i terminalen:**

```bash
# Uppdatera .env
cd gpt-relay-server
# Redigera .env och ändra OLLAMA_MODEL=llama3
```

**Sedan i RunPod Dashboard:**
1. Edit Endpoint
2. Environment Variables → `OLLAMA_MODEL_NAME=llama3`
3. Save Endpoint
4. Vänta på "Ready"
5. Testa!

