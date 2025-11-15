# ⚙️ RunPod Hub Ollama Worker - Konfiguration

## Konfigurationsdialog

Du ser följande fält:

### 1. Model Name ⭐ VIKTIGT

**Vad du ska fylla i:**
```
nocturne-swe
```

**Beskrivning:** Detta är din Ollama-modell som ska pre-loadas när containern startar.

**OBS:** 
- Modellen måste vara tillgänglig i Ollama
- Om modellen inte finns, kommer Ollama försöka ladda ner den vid första anrop
- För att säkerställa att modellen finns, kan du behöva köra `ollama pull nocturne-swe` först

---

### 2. Max Concurrency

**Vad du ska fylla i:**
```
8
```
(Behåll default-värdet)

**Beskrivning:** Maximalt antal samtidiga requests som Ollama kan hantera.

**Rekommendation:** 
- För test: `8` (default) är bra
- För produktion: Kan öka till `16` om du har många samtidiga användare

---

### 3. Parallel Requests

**Vad du ska fylla i:**
```
4
```
(Eller lämna tomt för default)

**Beskrivning:** Maximalt antal parallella requests.

**Rekommendation:**
- För test: `4` eller lämna tomt (default)
- För produktion: Kan öka till `8` om behövs

---

## Sammanfattning - Vad du ska fylla i:

| Fält | Värde |
|------|-------|
| **Model Name** | `nocturne-swe` ⭐ |
| **Max Concurrency** | `8` (default) |
| **Parallel Requests** | `4` (eller tomt för default) |

---

## Nästa Steg

1. **Fyll i Model Name:** `nocturne-swe`
2. **Lämna Max Concurrency:** `8` (eller justera om behövs)
3. **Fyll i Parallel Requests:** `4` (eller lämna tomt)
4. **Klicka "Next"**

---

## Efter Konfiguration

RunPod kommer:
- ✅ Skapa endpoint med Ollama worker
- ✅ Pre-loada `nocturne-swe` modellen
- ✅ Konfigurera Ollama API på port 11434
- ✅ Ge dig en endpoint URL

---

## Viktigt om Modellen

Om `nocturne-swe` inte finns i Ollama's modell-register:
- Ollama kommer försöka ladda ner den vid första anrop
- Detta kan ta tid (30-60 sekunder)
- Efter första laddning är den cachad

**Alternativ:** Om modellen inte finns, kan du behöva:
1. Pusha modellen till Ollama's registry först
2. Eller använda en annan modell som finns (t.ex. `llama3`, `mistral`, etc.)

---

**Fyll i Model Name: `nocturne-swe` och klicka Next!** 🚀

