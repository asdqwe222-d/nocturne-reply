# 🔧 Build Troubleshooting Guide

## Build Failed - Vanliga Orsaker

### 1. Dockerfile Syntax Error
- Kontrollera att alla `RUN` kommandon är korrekta
- Se till att inga rader är ofullständiga

### 2. Handler.py Fel
- Python syntax errors
- Saknade imports
- Felaktiga paths

### 3. Requirements.txt Problem
- Paket som inte finns
- Versionskonflikter

### 4. Ollama Installation Problem
- Ollama installerar inte korrekt
- Network timeout under installation

### 5. Container Start Command Fel
- Felaktig path till handler.py
- Python inte installerat korrekt

---

## 🔍 Debugging Steg

### Steg 1: Kolla Build Logs

I RunPod Dashboard → Builds → Klicka på failed build → Scrolla ner för att se felmeddelandet.

Vanliga fel:
- `ERROR: failed to solve: ...` → Dockerfile problem
- `ModuleNotFoundError: ...` → Saknat Python-paket
- `FileNotFoundError: ...` → Felaktig path
- `Command failed: ...` → Kommando kördes inte korrekt

### Steg 2: Testa Lokalt (Om möjligt)

```bash
cd gpt-relay-server
docker build -t test-nocturne .
docker run test-nocturne
```

### Steg 3: Kolla Handler Path

Se till att `handler.py` finns i rätt mapp och att Dockerfile kopierar den korrekt.

---

## 🛠️ Vanliga Fixes

### Fix 1: Uppdatera Container Start Command

I RunPod endpoint config, kontrollera:
- **Container Start Command:** `python /app/handler.py`
- **Handler Path:** `gpt-relay-server/handler.py` (eller bara `handler.py` om i root)

### Fix 2: Lägg till Error Handling

Uppdatera `handler.py` för bättre felhantering.

### Fix 3: Förenkla Dockerfile

Om builden misslyckas, prova en enklare Dockerfile först för att isolera problemet.

---

## 📋 Checklista

- [ ] Build logs lästa och fel identifierat
- [ ] Dockerfile syntax korrekt
- [ ] handler.py finns i repo
- [ ] requirements.txt korrekt
- [ ] Container Start Command korrekt
- [ ] Environment Variables korrekta

---

**Nästa:** Kolla build logs för specifikt felmeddelande!

