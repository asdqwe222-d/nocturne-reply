# 📤 Push Dockerfile med Pre-load

## Problem

Build-loggarna visar att pre-load steget saknas. Detta betyder att Dockerfile i GitHub inte har pre-load steget ännu.

## Lösning: Push till GitHub

```bash
cd C:\Users\Oliwer\Desktop\Cursor\Nocturne\gpt-relay-server

# Lägg till Dockerfile
git add Dockerfile

# Commit
git commit -m "Add model pre-load to reduce cold start time"

# Push
git push
```

## Efter Push

1. RunPod kommer automatiskt starta ny build
2. Den nya builden kommer inkludera pre-load steget
3. Build-tid kommer öka från ~2 min till ~5-10 min (för att ladda ner modellen)
4. Cold start kommer minska från 30-60s till 10-15s

## Vad Pre-load Gör

Under build:
- Startar Ollama server
- Laddar ner `nocturne-swe` modellen (~4-8 GB)
- Sparar modellen i Docker image
- Stänger Ollama

Resultat:
- Modellen finns redan när containern startar
- Ingen nedladdning vid runtime
- Snabbare cold start (10-15s istället för 30-60s)

---

**Push Dockerfile nu för att aktivera pre-load!**

