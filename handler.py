"""
RunPod Serverless Handler for Ollama Inference
This handler receives requests and forwards them to Ollama
"""

import runpod
import os
import subprocess
import json
import time

# Initialize Ollama if not already running
def init_ollama():
    """Start Ollama server if not running"""
    try:
        # Check if Ollama is running
        result = subprocess.run(['ollama', 'list'], capture_output=True, timeout=5)
        if result.returncode == 0:
            print("[RunPod] Ollama is already running")
            return True
    except:
        pass
    
    # Start Ollama server
    try:
        print("[RunPod] Starting Ollama server...")
        subprocess.Popen(['ollama', 'serve'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(5)  # Wait for Ollama to start
        print("[RunPod] Ollama server started")
        return True
    except Exception as e:
        print(f"[RunPod] Failed to start Ollama: {e}")
        return False

# Pre-load model on startup
def preload_model(model_name="nocturne-swe"):
    """Pre-load the model to reduce cold start time"""
    try:
        print(f"[RunPod] Pre-loading model: {model_name}")
        result = subprocess.run(['ollama', 'run', model_name, 'test'], 
                              capture_output=True, timeout=30)
        print(f"[RunPod] Model {model_name} pre-loaded")
    except Exception as e:
        print(f"[RunPod] Warning: Could not pre-load model: {e}")

# Initialize on worker startup
if not init_ollama():
    print("[RunPod] WARNING: Ollama initialization failed")
else:
    # Pre-load model (optional, but recommended)
    # Run in background to avoid blocking startup
    MODEL_NAME = os.getenv("OLLAMA_MODEL", "nocturne-swe")
    try:
        preload_model(MODEL_NAME)
    except Exception as e:
        print(f"[RunPod] Warning: Could not pre-load model at startup: {e}")
        print("[RunPod] Model will be loaded on first request")

def handler(event):
    """
    RunPod Serverless Handler
    
    Expected input format:
    {
        "model": "nocturne-swe",
        "prompt": "user prompt",
        "system": "system prompt",
        "stream": false,
        "options": {
            "temperature": 0.85,
            "top_p": 0.9,
            "repeat_penalty": 1.3,
            "num_ctx": 4096,
            "num_predict": 600
        }
    }
    """
    try:
        input_data = event.get("input", {})
        
        model = input_data.get("model", MODEL_NAME)
        prompt = input_data.get("prompt", "")
        system = input_data.get("system", "")
        stream = input_data.get("stream", False)
        options = input_data.get("options", {})
        
        if not prompt:
            return {"error": "Prompt is required"}
        
        print(f"[RunPod] Processing request for model: {model}")
        print(f"[RunPod] Prompt length: {len(prompt)}")
        
        # Build Ollama API request
        ollama_request = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": options
        }
        
        if system:
            ollama_request["system"] = system
        
        # Call Ollama API
        import requests
        ollama_url = "http://localhost:11434/api/generate"
        
        response = requests.post(ollama_url, json=ollama_request, timeout=180)
        response.raise_for_status()
        
        ollama_data = response.json()
        result_text = ollama_data.get("response", "")
        
        print(f"[RunPod] Response generated, length: {len(result_text)}")
        
        return {
            "response": result_text,
            "model": model,
            "done": ollama_data.get("done", True)
        }
        
    except Exception as e:
        print(f"[RunPod] Error: {str(e)}")
        return {
            "error": str(e),
            "response": ""
        }

# Start RunPod serverless handler
runpod.serverless.start({"handler": handler})

