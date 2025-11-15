# ⚡ Cold Start Solutions

## Quick Answer

**Build phase:** One-time, happens when you deploy (~2-5 min)  
**Runtime cold start:** Happens **EVERY TIME** with Flex workers after inactivity (30-60s)

---

## Solutions

### Option 1: Pre-load Model in Dockerfile ✅ IMPLEMENTED

**What it does:**
- Downloads model during Docker build
- Model is already in the image when container starts
- Reduces cold start from 30-60s to **10-15s**

**Trade-offs:**
- ✅ Faster cold starts
- ✅ Still works with Flex workers
- ❌ Larger Docker image (~4-8 GB)
- ❌ Longer build time (~5-10 min)

**Status:** ✅ Already implemented in Dockerfile

---

### Option 2: Switch to Active Workers (Best for Production)

**What it does:**
- Container stays running 24/7
- Model stays loaded in memory
- **Zero cold starts** after initial deploy

**How to switch:**
1. Go to RunPod Dashboard → Your Endpoint → Settings
2. Change **Worker Type** from "Flex" to "Active"
3. Save changes

**Cost comparison:**
- **Flex:** $0.00034/s × usage time (only pay when using)
- **Active:** ~$0.00024/s × 24 hours = ~$20-30/day (always on, but 20-30% discount)

**When to use:**
- ✅ Production/high usage
- ✅ Want zero cold starts
- ✅ Can afford ~$20-30/day

---

### Option 3: Keep Container Warm (Hack)

Make a small request every 5 minutes to keep container alive:

```javascript
// In userscript
setInterval(async () => {
  if (MODE === 'runpod') {
    try {
      await callRunPod('test'); // Small keep-alive request
    } catch (e) {
      // Ignore errors
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

**Trade-offs:**
- ✅ No cold starts
- ❌ Costs money for keep-alive requests
- ❌ More complex

---

## Recommendation

### For Testing (Current):
- ✅ **Keep Flex workers** (cheaper)
- ✅ **Pre-load model** (already done - reduces to 10-15s)
- ✅ Accept 10-15s cold start first request

### For Production:
- ✅ **Switch to Active workers** (zero cold starts)
- ✅ **Pre-load model** (faster initial deploy)
- ✅ All requests are fast (~5 seconds)

---

## Expected Behavior After Pre-load

**With Flex workers + pre-load:**
- First request after inactivity: **10-15 seconds** (was 30-60s)
- Subsequent requests (within session): **5 seconds**
- After 5-10 min inactivity: **10-15 seconds** again

**With Active workers + pre-load:**
- Initial deploy: **30-60 seconds** (one-time)
- All subsequent requests: **5 seconds** (no cold starts!)

---

**Next step:** Rebuild your endpoint to apply the pre-load changes!

