# Nocturne Reply - Ollama Serverless

RunPod serverless endpoint for custom Ollama model `nocturne-swe`.

## Quick Deploy to RunPod

### Option 1: GitHub Integration (Recommended)

1. Go to https://console.runpod.io/serverless
2. Click **"+ New Endpoint"**
3. Fill in:
   - **Repository**: `https://github.com/asdqwe222-d/nocturne-reply`
   - **Branch**: `main`
   - **Build Context**: `.` (or leave empty)
   - **Dockerfile**: `Dockerfile`
   - **Container Disk**: `20 GB`
   - **GPU**: RTX 3090 or A40
4. Add Environment Variables:
   ```
   OLLAMA_MODEL=nocturne-swe
   OLLAMA_HOST=0.0.0.0:11434
   ```
5. Click **Deploy**

### Option 2: Docker Image (if GitHub fails)

If GitHub integration doesn't work, use pre-built image:

```
Image: asdqwe222d/nocturne-ollama:latest
```

## Test the Endpoint

```bash
curl -X POST https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "Say hello in Swedish",
      "model": "nocturne-swe"
    }
  }'
```

## Files

- `Dockerfile` - Container definition
- `handler.py` - RunPod serverless handler
- `requirements.txt` - Python dependencies
- `Modelfile` - Ollama model configuration

## First Request

⚠️ First request takes 5-10 minutes (downloads 8GB model). Subsequent requests: 5-15 seconds.

