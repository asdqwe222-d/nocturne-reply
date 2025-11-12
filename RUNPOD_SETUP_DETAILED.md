# 🚀 RunPod Serverless Setup - Detailed Step-by-Step Guide

## Overview

This guide will walk you through setting up RunPod Serverless for Nocturne Reply Forge. RunPod Serverless allows you to run Ollama inference in the cloud without managing servers.

**Cost:** ~$0.0011-0.0015 per generation (A40, ~5 seconds)

---

## Step 1: Create RunPod Account

1. Go to https://www.runpod.io
2. Click **"Sign Up"** or **"Get Started"**
3. Create account (email + password)
4. Verify your email
5. **Add payment method** (required for serverless)
   - Go to **Settings → Billing**
   - Add credit card or PayPal
   - RunPod uses pay-as-you-go, so you only pay for what you use

---

## Step 2: Create Serverless Endpoint

### 2.1 Navigate to Serverless

1. Log in to RunPod Dashboard
2. Click **"Serverless"** in the left sidebar
3. Click **"New Endpoint"** button

### 2.2 Configure Endpoint

**Basic Settings:**
- **Endpoint Name:** `nocturne-ollama` (or any name you prefer)
- **GPU Type:** 
  - **A40** (48GB VRAM) - Recommended for 70B models
  - **RTX 3090** (24GB VRAM) - Cheaper, good for 12B models
  - **A5000** (24GB VRAM) - Alternative to RTX 3090

**Worker Configuration:**
- **Worker Type:** 
  - **Flex** - Pay-per-use, scales to zero (cheaper for low usage)
  - **Active** - Always-on, 20-30% discount (better for frequent usage)
- **Max Workers:** `1` (for single user, increase if multi-user)
- **FlashBoot:** Enable (reduces cold start to <250ms)

**Container Configuration:**

**Option A: Use RunPod Ollama Template (Easiest)**
1. Click **"Templates"** tab
2. Search for **"Ollama"**
3. Select **"Ollama Serverless"** template
4. Configure:
   - **Model:** `nocturne-swe` (or your model name)
   - **Environment Variables:** Leave default

**Option B: Custom Docker Image**
1. Click **"Docker Image"** tab
2. Enter Docker image URL (e.g., from Docker Hub)
3. Or use RunPod's Ollama base image:
   ```
   runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel
   ```

### 2.3 Create Endpoint

1. Review your settings
2. Click **"Create Endpoint"**
3. Wait 1-2 minutes for endpoint to be created
4. **Copy the endpoint URL** - you'll need this!

**Endpoint URL format:**
```
https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
```

---

## Step 3: Get API Key

1. Go to **Settings → API Keys**
2. Click **"Create API Key"**
3. Give it a name: `nocturne-serverless`
4. **Copy the API key immediately** - you won't see it again!
5. Save it securely (you'll need it for `.env`)

---

## Step 4: Configure Your Server

### 4.1 Update `.env` File

Open `gpt-relay-server/.env` and add:

```bash
# RunPod Serverless Configuration
RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ENDPOINT_ID/run
RUNPOD_API_KEY=your-api-key-here

# Use RunPod instead of local Ollama (set to 'true' to force RunPod)
USE_RUNPOD=false

# Use RunPod as fallback if local Ollama fails (set to 'true' for hybrid)
RUNPOD_FALLBACK=true
```

**Replace:**
- `YOUR_ENDPOINT_ID` with your actual endpoint ID from Step 2.3
- `your-api-key-here` with your API key from Step 3

### 4.2 Choose Your Mode

**Mode 1: Hybrid (Recommended)** ⭐
```bash
USE_RUNPOD=false
RUNPOD_FALLBACK=true
```
- Tries local Ollama first (free)
- Falls back to RunPod if local fails
- Best of both worlds!

**Mode 2: RunPod Only**
```bash
USE_RUNPOD=true
RUNPOD_FALLBACK=false
```
- All requests go to RunPod
- No local Ollama needed
- Perfect if you don't have GPU

**Mode 3: Local Only**
```bash
USE_RUNPOD=false
RUNPOD_FALLBACK=false
```
- Only uses local Ollama
- No RunPod costs
- Requires local GPU/CPU

---

## Step 5: Test Configuration

### 5.1 Start Server

```bash
cd gpt-relay-server
npm start
```

You should see:
```
GPT Relay Server running at http://localhost:3000
🌐 RunPod Serverless: ENABLED (fallback mode)
   Endpoint: https://api.runpod.io/v2/YOUR_ID/run...
   Will fallback to RunPod if local Ollama fails
```

### 5.2 Test RunPod Connection

Create a test file `test-runpod.js`:

```javascript
require('dotenv').config();
const { callRunPodServerless, checkRunPodHealth } = require('./runpod-client');

async function test() {
    console.log('Testing RunPod connection...');
    
    // Test health check
    const health = await checkRunPodHealth(
        process.env.RUNPOD_ENDPOINT_URL,
        process.env.RUNPOD_API_KEY
    );
    console.log('Health check:', health ? 'OK' : 'Failed');
    
    // Test generation
    try {
        const result = await callRunPodServerless(
            process.env.RUNPOD_ENDPOINT_URL,
            process.env.RUNPOD_API_KEY,
            'nocturne-swe',
            'Say hello in Swedish',
            'You are a helpful assistant.',
            { temperature: 0.7 },
            30000
        );
        console.log('Test response:', result.response.substring(0, 100));
        console.log('✅ RunPod connection successful!');
    } catch (error) {
        console.error('❌ RunPod test failed:', error.message);
    }
}

test();
```

Run it:
```bash
node test-runpod.js
```

### 5.3 Test Full Generation

Make a test request to your server:

```bash
curl -X POST http://localhost:3000/generate-with-scoring \
  -H "Content-Type: application/json" \
  -d '{
    "history": [{"role": "user", "content": "Hej"}],
    "latestMessage": "Hur är läget?",
    "generateCount": 3
  }'
```

Or use Postman/Thunder Client with the same request.

---

## Step 6: Verify It Works

### Check Server Logs

When you make a request, you should see:

**If using local Ollama:**
```
[Nocturne] Calling local Ollama...
[Nocturne] Local Ollama response received, length: 1234
```

**If falling back to RunPod:**
```
[Nocturne] Local Ollama failed: Connection refused
[Nocturne] Falling back to RunPod Serverless...
[Nocturne] Calling RunPod Serverless...
[RunPod] Calling serverless endpoint: https://api.runpod.io/v2/...
[RunPod] Response received, length: 1234
[Nocturne] RunPod Serverless response received, length: 1234
```

### Check RunPod Dashboard

1. Go to RunPod Dashboard → Serverless
2. Click on your endpoint
3. Check **"Logs"** tab to see requests
4. Check **"Metrics"** tab to see usage and costs

---

## Troubleshooting

### Problem: "RunPod API error: 401"

**Solution:**
- Check `RUNPOD_API_KEY` in `.env` is correct
- Verify API key hasn't expired
- Regenerate API key if needed

### Problem: "RunPod API error: 404"

**Solution:**
- Check `RUNPOD_ENDPOINT_URL` in `.env` is correct
- Verify endpoint exists in RunPod dashboard
- Make sure endpoint is **Active** (not paused/deleted)

### Problem: "RunPod request timeout"

**Solution:**
- First request takes longer (cold start) - wait 30-60 seconds
- Increase timeout in `runpod-client.js` (currently 120000ms = 2 min)
- Consider using **Active Workers** for faster startup

### Problem: "Unexpected response format"

**Solution:**
- Your RunPod endpoint might use different response format
- Check RunPod endpoint logs to see actual response
- Update `runpod-client.js` response parsing if needed

### Problem: Endpoint not responding

**Solution:**
1. Check RunPod dashboard → Serverless → Your endpoint
2. Verify endpoint status is **"Active"**
3. Check **"Logs"** tab for errors
4. Try restarting endpoint (pause → resume)

---

## Cost Monitoring

### Check Your Usage

1. Go to RunPod Dashboard → **Billing**
2. View **"Usage"** tab
3. Filter by **"Serverless"**
4. See cost per day/hour

### Estimate Monthly Cost

**A40 Active (50 gen/day):**
- Per generation: $0.0011
- Daily: 50 × $0.0011 = $0.055
- Monthly: $0.055 × 30 = **$1.65/month**

**A40 Active (200 gen/day):**
- Per generation: $0.0011
- Daily: 200 × $0.0011 = $0.22
- Monthly: $0.22 × 30 = **$6.60/month**

---

## Advanced Configuration

### Custom Model Loading

If your endpoint needs to load a custom model:

1. Update your Docker image to pre-load model:
```dockerfile
FROM runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Pre-load your model
RUN ollama pull nocturne-swe

# Your handler
COPY handler.py /handler.py
CMD ["python", "/handler.py"]
```

2. Or use environment variables in RunPod endpoint config:
```
OLLAMA_MODEL=nocturne-swe
```

### Multiple Endpoints

You can create multiple endpoints for different models:

```bash
# .env
RUNPOD_ENDPOINT_URL_12B=https://api.runpod.io/v2/ENDPOINT_12B/run
RUNPOD_ENDPOINT_URL_70B=https://api.runpod.io/v2/ENDPOINT_70B/run
```

Then update `server.js` to choose endpoint based on model size.

---

## Quick Reference

### Environment Variables

```bash
# Required for RunPod
RUNPOD_ENDPOINT_URL=https://api.runpod.io/v2/YOUR_ID/run
RUNPOD_API_KEY=your-api-key-here

# Optional (defaults shown)
USE_RUNPOD=false          # Force RunPod (skip local)
RUNPOD_FALLBACK=true      # Use RunPod if local fails
```

### Endpoint URL Format

```
https://api.runpod.io/v2/{endpoint_id}/run
```

### API Key Location

RunPod Dashboard → Settings → API Keys

---

## Next Steps

1. ✅ RunPod account created
2. ✅ Serverless endpoint created
3. ✅ API key generated
4. ✅ `.env` configured
5. ✅ Server tested
6. ✅ **Start using!**

---

## Support

- **RunPod Docs:** https://docs.runpod.io/serverless/
- **RunPod Discord:** https://discord.gg/runpod
- **RunPod Support:** support@runpod.io

---

**Last Updated:** 2025-11

