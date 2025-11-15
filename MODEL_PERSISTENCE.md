# 💾 Model Persistence i RunPod Serverless

## Kort svar: Det beror på Worker Type

### Flex Workers (Pay-per-use)
- ❌ **Ja, modellen laddas ner varje gång** (cold start)
- Varje anrop startar en ny container
- Första anropet tar längre tid (~30-60 sekunder för att ladda ner modellen)
- Efterföljande anrop i samma session är snabba (modellen finns redan i minnet)
- Container stängs av efter inaktivitet

### Active Workers (Always-on)
- ✅ **Nej, modellen laddas bara en gång**
- Container är alltid på
- Modellen finns kvar i minnet mellan anrop
- Snabbare svar (ingen cold start)
- Men kostar även när den inte används

---

## 🚀 Lösningar för att minska cold starts

### Lösning 1: Pre-load modellen i Dockerfile (Rekommenderat)

Uppdatera `Dockerfile` för att ladda ner modellen vid build-tid:

```dockerfile
# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Pre-load model during build
RUN ollama pull nocturne-swe

# Rest of Dockerfile...
```

**Fördelar:**
- ✅ Modellen finns redan när containern startar
- ✅ Snabbare första anrop (ingen nedladdning)
- ✅ Fungerar med både Flex och Active workers

**Nackdelar:**
- ❌ Docker image blir större (~4-8 GB för en 12B modell)
- ❌ Build tar längre tid
- ❌ Kan öka lagringskostnader

---

### Lösning 2: Använd Active Workers

**Konfigurera Active Worker:**
- I RunPod, välj **"Active"** istället för **"Flex"**
- Container är alltid på
- Modellen laddas en gång och finns kvar

**Fördelar:**
- ✅ Ingen cold start efter första laddning
- ✅ Snabbare svar
- ✅ 20-30% rabatt på GPU-kostnad

**Nackdelar:**
- ❌ Kostar även när den inte används
- ❌ Bättre för produktion än test

---

### Lösning 3: Pre-load i handler.py (Nuvarande lösning)

Din nuvarande `handler.py` har redan pre-load funktion:

```python
# Pre-load model on startup
def preload_model(model_name="nocturne-swe"):
    """Pre-load the model to reduce cold start time"""
    try:
        print(f"[RunPod] Pre-loading model: {model_name}")
        result = subprocess.run(['ollama', 'run', model_name, 'test'], 
                              capture_output=True, timeout=30)
        print(f"[RunPod] Model {model_name} pre-loaded")
    except Exception as e:
        print(f"[RunPod] Warning: Could not pre-load model: {e}")
```

**Detta hjälper, men:**
- ✅ Modellen laddas när containern startar (inte vid varje anrop)
- ❌ För Flex workers: Modellen laddas fortfarande vid varje ny container-start
- ✅ För Active workers: Modellen laddas bara en gång

---

### Lösning 4: Använd Volumes (Avancerat)

RunPod stödjer volumes för persistent storage:

1. **Skapa Volume i RunPod:**
   - Settings → Volumes → Create Volume
   - Storlek: 20-50 GB (för modeller)

2. **Mounta volume i endpoint:**
   - Volume Mount Path: `/models`
   - Spara modeller i `/models` istället för standard-plats

3. **Uppdatera handler.py:**
   ```python
   # Set Ollama model path to volume
   os.environ['OLLAMA_MODELS'] = '/models'
   ```

**Fördelar:**
- ✅ Modeller sparas mellan container-starts
- ✅ Fungerar med Flex workers

**Nackdelar:**
- ❌ Mer komplex setup
- ❌ Extra kostnad för volume storage

---

## 💰 Kostnad-jämförelse

### Scenario: 50 generationer/dag, ~5 sekunder per generation

**Flex Workers (med cold start):**
- Cold start: ~30 sekunder första gången
- Efterföljande: ~5 sekunder
- Kostnad: ~$0.10/dag (med cold starts)

**Active Workers:**
- Inga cold starts efter första laddning
- Kostnad: ~$29/dag (alltid på)
- Men 20-30% rabatt = ~$20-23/dag

**Rekommendation:**
- **Test/Låg användning:** Flex workers (billigare)
- **Produktion/Hög användning:** Active workers (snabbare, bättre UX)

---

## 🎯 Rekommenderad lösning för dig

### För nu (Test-fas):

1. **Behåll Flex workers** (billigare)
2. **Lägg till pre-load i Dockerfile** (för snabbare cold starts)
3. **Acceptera cold start första gången** (~30 sekunder)

### För produktion:

1. **Byt till Active workers** (snabbare, bättre UX)
2. **Pre-load i Dockerfile** (för snabbare första laddning)
3. **Modellen finns kvar i minnet** mellan anrop

---

## 🔧 Implementera Pre-load i Dockerfile

Vill du att jag uppdaterar Dockerfile för att pre-loada modellen? Detta kommer:
- ✅ Minska cold start-tid från ~30 sekunder till ~5 sekunder
- ✅ Göra Docker image större (~4-8 GB)
- ✅ Öka build-tid från ~2 minuter till ~5-10 minuter

---

## 📊 Cold Start Timing

**Utan pre-load:**
- Container start: ~5 sekunder
- Ollama start: ~2 sekunder
- Model download: ~20-30 sekunder (första gången)
- **Total: ~30-40 sekunder första anropet**

**Med pre-load i Dockerfile:**
- Container start: ~5 sekunder
- Ollama start: ~2 sekunder
- Model load från disk: ~2-3 sekunder
- **Total: ~10 sekunder första anropet**

**Med Active workers:**
- Container redan startad
- Model redan laddad
- **Total: ~5 sekunder (samma som vanligt anrop)**

---

**Vill du att jag uppdaterar Dockerfile för att pre-loada modellen?**

