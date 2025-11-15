"""
RunPod Serverless Handler for Ollama Inference
Simplified startup - model creation on first request only
"""

import runpod
import os
import subprocess
import time
import sys

MODEL_NAME = os.getenv("OLLAMA_MODEL", "nocturne-swe")
MODEL_INITIALIZED = False

def ensure_ollama_running():
    """Ensure Ollama server is running"""
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, timeout=2)
        if result.returncode == 0:
            return True
    except:
        pass
    
    # Start Ollama if not running
    try:
        subprocess.Popen(['ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(3)
        return True
    except Exception as e:
        print(f"[RunPod] Failed to start Ollama: {e}", file=sys.stderr)
        return False

def model_exists(model_name):
    """Check if model exists"""
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True, timeout=5)
        return model_name in result.stdout
    except:
        return False

def ensure_model_ready(model_name):
    """Create model if it doesn't exist - called on first request"""
    global MODEL_INITIALIZED
    
    if MODEL_INITIALIZED:
        return True
    
    if not ensure_ollama_running():
        return False
    
    if model_exists(model_name):
        print(f"[RunPod] Model {model_name} exists")
        MODEL_INITIALIZED = True
        return True
    
    print(f"[RunPod] Creating model {model_name} from Modelfile...")
    
    # Pull base model
    try:
        print("[RunPod] Pulling base model (8GB, may take 5-10 min)...")
        pull = subprocess.run(
            ['ollama', 'pull', 'mistral-nemo:12b-instruct-2407-q4_K_M'],
            capture_output=True,
            text=True,
            timeout=600
        )
        if pull.returncode != 0:
            print(f"[RunPod] Pull failed: {pull.stderr}", file=sys.stderr)
            return False
        print("[RunPod] Base model downloaded")
    except subprocess.TimeoutExpired:
        print("[RunPod] Model pull timeout", file=sys.stderr)
        return False
    
    # Create custom model
    try:
        print(f"[RunPod] Creating {model_name}...")
        create = subprocess.run(
            ['ollama', 'create', model_name, '-f', '/app/Modelfile'],
            capture_output=True,
            text=True,
            timeout=120
        )
        if create.returncode != 0:
            print(f"[RunPod] Create failed: {create.stderr}", file=sys.stderr)
            return False
        print(f"[RunPod] Model {model_name} ready")
        MODEL_INITIALIZED = True
        return True
    except subprocess.TimeoutExpired:
        print("[RunPod] Model create timeout", file=sys.stderr)
        return False

def handler(event):
    """
    RunPod Serverless Handler
    
    Input format:
    {
        "input": {
            "prompt": "text",
            "system": "optional system prompt",
            "model": "optional model name",
            "options": {}
        }
    }
    """
    try:
        input_data = event.get("input", {})
        prompt = input_data.get("prompt", "")
        system = input_data.get("system", "")
        model = input_data.get("model", MODEL_NAME)
        options = input_data.get("options", {})
        
        if not prompt:
            return {"error": "Prompt is required"}
        
        # Ensure model is ready (lazy initialization)
        if not ensure_model_ready(model):
            return {"error": "Model initialization failed"}
        
        # Call Ollama
        import requests
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": options
        }
        if system:
            payload["system"] = system
        
        response = requests.post(
            "http://localhost:11434/api/generate",
            json=payload,
            timeout=180
        )
        response.raise_for_status()
        
        data = response.json()
        return {
            "response": data.get("response", ""),
            "model": model,
            "done": data.get("done", True)
        }
        
    except requests.RequestException as e:
        print(f"[RunPod] Request error: {e}", file=sys.stderr)
        return {"error": f"Ollama request failed: {str(e)}"}
    except Exception as e:
        print(f"[RunPod] Error: {e}", file=sys.stderr)
        return {"error": str(e)}

# Start RunPod handler
print("[RunPod] Handler starting...", flush=True)
runpod.serverless.start({"handler": handler})
