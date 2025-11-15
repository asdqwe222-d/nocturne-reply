# ⚡ Snabb Fix för Build Error

## Problem
```
"/gpt-relay-server/handler.py": not found
```

## Lösning: Kontrollera att filen är pushat

### Steg 1: Kolla GitHub Repo

Gå till: https://github.com/asdqwe222-d/nocturne-reply

Kolla om dessa filer finns:
- `gpt-relay-server/handler.py`
- `gpt-relay-server/Dockerfile`
- `gpt-relay-server/requirements.txt`

### Steg 2: Om filerna saknas, pusha dem

```bash
cd C:\Users\Oliwer\Desktop\Cursor\Nocturne\gpt-relay-server

# Kontrollera status
git status

# Lägg till alla filer
git add handler.py Dockerfile requirements.txt

# Commit
git commit -m "Add RunPod handler files"

# Push
git push
```

### Steg 3: Rebuild i RunPod

1. Gå till RunPod Dashboard → Serverless → din endpoint
2. Klicka på "Rebuild"
3. Välj branch: `main`
4. Klicka "Rebuild"

---

## Alternativ: Flytta till repo-root (Enklare)

Om problemet kvarstår, flytta filerna till repo-root:

```bash
cd C:\Users\Oliwer\Desktop\Cursor\Nocturne

# Flytta filer
mv gpt-relay-server/Dockerfile .
mv gpt-relay-server/handler.py .
mv gpt-relay-server/requirements.txt .

# Uppdatera Dockerfile (ändra COPY till):
# COPY handler.py /app/handler.py
# COPY requirements.txt /app/requirements.txt

# Push
cd gpt-relay-server
git add ..
git commit -m "Move RunPod files to repo root"
git push
```

Sedan i RunPod:
- Ändra Dockerfile Path till: `Dockerfile` (från repo-root)

---

**Testa först att pusha filerna, sedan alternativ om det behövs!**

