# 🚀 RunPod Serverless Setup Guide

## Overview

RunPod Serverless allows you to run Ollama inference in the cloud without managing servers. You only pay for the time your requests are processed.

**Cost:** ~$0.00095 per generation (RTX 3090, ~5 seconds)

---

## Prerequisites

1. **RunPod Account**
   - Sign up at https://www.runpod.io
   - Add payment method

2. **Create Serverless Endpoint**
   - Go to RunPod Dashboard → Serverless
   - Click "New Endpoint"
   - Choose GPU: RTX 3090 or A5000 (recommended)
   - Select template: "Ollama" or create custom

---

## Configuration

### 1. Get Your Endpoint URL

After creating the endpoint, you'll get a URL like:
```
https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
```

### 2. Get Your API Key

1. Go to RunPod Dashboard → Settings → API Keys
2. Create a new API key
3. Copy the key (you won't see it again!)

### 3. Update `.env` File

Add these variables to `gpt-relay-server/.env`:

```bash
# RunPod Serverless Configuration
RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
RUNPOD_API_KEY=your-api-key-here

# Use RunPod instead of local Ollama (set to 'true' to force RunPod)
USE_RUNPOD=false

# Use RunPod as fallback if local Ollama fails (set to 'true' for hybrid)
RUNPOD_FALLBACK=true
```

---

## Usage Modes

### Mode 1: RunPod Only (No Local Ollama)
```bash
USE_RUNPOD=true
RUNPOD_FALLBACK=false
```
- All requests go to RunPod
- No local Ollama needed
- Perfect if you don't have GPU

### Mode 2: Hybrid (Local + RunPod Fallback) ⭐ RECOMMENDED
```bash
USE_RUNPOD=false
RUNPOD_FALLBACK=true
```
- Tries local Ollama first (free)
- Falls back to RunPod if local fails
- Best of both worlds!

### Mode 3: Local Only (Default)
```bash
USE_RUNPOD=false
RUNPOD_FALLBACK=false
```
- Only uses local Ollama
- No RunPod costs
- Requires local GPU/CPU

---

## Testing

### Test RunPod Connection

```bash
cd gpt-relay-server
node -e "require('dotenv').config(); const {checkRunPodHealth} = require('./runpod-client'); checkRunPodHealth(process.env.RUNPOD_ENDPOINT_URL, process.env.RUNPOD_API_KEY).then(ok => console.log('RunPod health:', ok));"
```

### Test Generation

Start the server and make a test request:

```bash
npm start
```

Then test with curl or Postman:
```bash
curl -X POST http://localhost:3000/generate-with-scoring \
  -H "Content-Type: application/json" \
  -d '{
    "history": [{"role": "user", "content": "Hej"}],
    "latestMessage": "Hur är läget?",
    "generateCount": 3
  }'
```

---

## Cost Estimation

**Per generation (~5 seconds):**
- RTX 3090 Flex: $0.00095
- RTX 3090 Active: $0.00065

**Monthly (50 generations/day):**
- RTX 3090 Flex: ~$1.43/month
- RTX 3090 Active: ~$0.98/month

**Monthly (200 generations/day):**
- RTX 3090 Flex: ~$5.70/month
- RTX 3090 Active: ~$3.90/month

---

## Troubleshooting

### Error: "RunPod API error: 401"
- Check your `RUNPOD_API_KEY` is correct
- Verify API key has proper permissions

### Error: "RunPod API error: 404"
- Check your `RUNPOD_ENDPOINT_URL` is correct
- Verify endpoint exists and is active

### Error: "RunPod request timeout"
- Endpoint might be cold (first request takes longer)
- Increase timeout in `runpod-client.js`
- Consider using Active Workers for faster startup

### Error: "Unexpected response format"
- Your RunPod endpoint might use a different format
- Check RunPod endpoint logs
- Adjust response parsing in `runpod-client.js`

---

## RunPod Endpoint Configuration

### Recommended Settings

**GPU:** RTX 3090 or A5000 (24GB VRAM)
**Worker Type:** Flex (pay-per-use) or Active (always-on, 20-30% discount)
**Container:** Ollama with your model pre-loaded
**Max Workers:** 1-2 (for single user)

### Docker Image (if custom)

If you need a custom Docker image:

```dockerfile
FROM runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Pre-load your model
RUN ollama pull nocturne-swe

# Your handler code here
COPY handler.py /handler.py
CMD ["python", "/handler.py"]
```

---

## Next Steps

1. ✅ Set up RunPod account
2. ✅ Create serverless endpoint
3. ✅ Add credentials to `.env`
4. ✅ Test connection
5. ✅ Choose usage mode (recommend Hybrid)
6. ✅ Start generating!

---

**Questions?** Check RunPod docs: https://docs.runpod.io/serverless/

