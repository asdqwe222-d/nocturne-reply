# 🔍 Hitta Felmeddelanden i RunPod

## Problem: Build failar men inga felmeddelanden syns

## Steg 1: Kolla Build Logs från Början

1. **Gå till din endpoint i RunPod**
2. **Klicka på "Build History" eller "Builds"**
3. **Klicka på den failed build**
4. **Scrolla till BÖRJAN av build logs** (inte slutet!)
5. **Leta efter:**
   - Röda textrader
   - `ERROR:` eller `FAILED:`
   - `failed to solve`
   - `failed to build`
   - `syntax error`
   - `not found`

## Steg 2: Kolla Specifika Steg

I build logs, leta efter dessa steg:

### Steg som ofta failar:

**1. Dockerfile parsing:**
```
ERROR: failed to solve: failed to parse Dockerfile
```

**2. COPY commands:**
```
ERROR: failed to solve: failed to compute cache key: "/handler.py": not found
```

**3. RUN commands:**
```
ERROR: The command '/bin/sh -c ...' returned a non-zero code
```

**4. Python installation:**
```
ERROR: Could not find a version that satisfies the requirement...
```

## Steg 3: Testa Dockerfile Lokalt (Om möjligt)

Om du har Docker installerat lokalt:

```bash
cd C:\Users\Oliwer\Desktop\Cursor\Nocturne\gpt-relay-server

# Testa att bygga lokalt
docker build -t test-nocturne .

# Om det failar lokalt, ser du felet direkt
```

## Steg 4: Kolla Endpoint Settings

Verifiera dessa inställningar i RunPod:

- **Dockerfile Path:** `Dockerfile` (inte `gpt-relay-server/Dockerfile`)
- **Handler Path:** `handler.py` (inte `gpt-relay-server/handler.py`)
- **Container Start Command:** `python /app/handler.py`
- **Container Disk:** `10 GB` eller mer

## Steg 5: Förenkla Dockerfile (Test)

Om inget fungerar, prova en minimal Dockerfile först:

```dockerfile
FROM runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel

WORKDIR /app

COPY handler.py /app/handler.py
COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir runpod requests

CMD ["python", "/app/handler.py"]
```

## Steg 6: Kontakta RunPod Support

Om inget fungerar:
1. Gå till RunPod Dashboard
2. Klicka "Support" eller "Help"
3. Skicka build logs och beskriv problemet

---

## Snabb Checklista

- [ ] Scrollat genom HELA build logs (från början till slut)
- [ ] Letat efter röda ERROR-meddelanden
- [ ] Kollat endpoint settings (Dockerfile Path, Handler Path)
- [ ] Verifierat att filer finns i GitHub repo-root
- [ ] Testat Dockerfile lokalt (om möjligt)

---

**Prova att scrolla genom HELA build logs från början - felet är där någonstans!** 🔍

