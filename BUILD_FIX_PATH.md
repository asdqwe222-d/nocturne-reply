# 🔧 Build Fix - Path Problem

## Problem

```
ERROR: "/gpt-relay-server/handler.py": not found
```

## Orsak

RunPod bygger från **repo-root**, men Dockerfile försökte kopiera från root:
- Dockerfile sa: `COPY handler.py` (letar i root)
- Men filen finns i: `gpt-relay-server/handler.py`

## Lösning

Uppdaterat Dockerfile att kopiera från rätt path:

```dockerfile
COPY gpt-relay-server/handler.py /app/handler.py
COPY gpt-relay-server/requirements.txt /app/requirements.txt
```

## Nästa Steg

1. **Push Dockerfile till GitHub:**
   ```bash
   cd C:\Users\Oliwer\Desktop\Cursor\Nocturne\gpt-relay-server
   git add Dockerfile
   git commit -m "Fix COPY paths for RunPod build context"
   git push
   ```

2. **Rebuild i RunPod:**
   - Build bör nu hitta filerna korrekt

---

**Dockerfile är nu fixad - push och rebuild!** 🚀

