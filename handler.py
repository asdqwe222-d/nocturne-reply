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

# Check if model exists
def model_exists(model_name):
    """Check if model exists in Ollama"""
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True, timeout=10)
        return model_name in result.stdout
    except:
        return False

# Create model from Modelfile if it doesn't exist
def create_model_from_modelfile(model_name="nocturne-swe", modelfile_path="/app/Modelfile"):
    """Create model from Modelfile if it doesn't exist"""
    if model_exists(model_name):
        print(f"[RunPod] Model {model_name} already exists")
        return True
    
    try:
        print(f"[RunPod] Model {model_name} not found, creating from Modelfile...")
        
        # First, pull the base model (mistral-nemo:12b-instruct-2407-q4_K_M)
        print("[RunPod] Pulling base model: mistral-nemo:12b-instruct-2407-q4_K_M")
        print("[RunPod] This may take 5-10 minutes on first run...")
        pull_result = subprocess.run(
            ['ollama', 'pull', 'mistral-nemo:12b-instruct-2407-q4_K_M'],
            capture_output=True,
            text=True,
            timeout=600  # 10 minutes timeout
        )
        
        if pull_result.returncode != 0:
            print(f"[RunPod] Warning: Failed to pull base model: {pull_result.stderr}")
            return False
        
        print("[RunPod] Base model pulled successfully")
        
        # Now create the custom model from Modelfile
        print(f"[RunPod] Creating {model_name} from Modelfile...")
        create_result = subprocess.run(
            ['ollama', 'create', model_name, '-f', modelfile_path],
            capture_output=True,
            text=True,
            timeout=120  # 2 minutes timeout
        )
        
        if create_result.returncode != 0:
            print(f"[RunPod] Error creating model: {create_result.stderr}")
            return False
        
        print(f"[RunPod] Model {model_name} created successfully")
        return True
        
    except subprocess.TimeoutExpired:
        print(f"[RunPod] Timeout while creating model {model_name}")
        return False
    except Exception as e:
        print(f"[RunPod] Error creating model: {e}")
        return False

# Pre-load model on startup
def preload_model(model_name="nocturne-swe"):
    """Pre-load the model to reduce cold start time"""
    try:
        print(f"[RunPod] Pre-loading model: {model_name}")
        result = subprocess.run(['ollama', 'run', model_name, 'test'], 
                              capture_output=True, timeout=60)
        print(f"[RunPod] Model {model_name} pre-loaded")
    except Exception as e:
        print(f"[RunPod] Warning: Could not pre-load model: {e}")

# Get model name from environment
MODEL_NAME = os.getenv("OLLAMA_MODEL", "nocturne-swe")

# Initialize on worker startup
if not init_ollama():
    print("[RunPod] WARNING: Ollama initialization failed")
else:
    # Create model from Modelfile if it doesn't exist
    # This will pull the base model and create nocturne-swe
    print(f"[RunPod] Checking if model {MODEL_NAME} exists...")
    if not model_exists(MODEL_NAME):
        print(f"[RunPod] Model {MODEL_NAME} not found, creating from Modelfile...")
        if create_model_from_modelfile(MODEL_NAME):
            print(f"[RunPod] Model {MODEL_NAME} is ready")
        else:
            print(f"[RunPod] WARNING: Failed to create model {MODEL_NAME}")
            print("[RunPod] Model will be created on first request (may take time)")
    else:
        print(f"[RunPod] Model {MODEL_NAME} exists")
    
    # Pre-load model (optional, but recommended)
    # Run in background to avoid blocking startup
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

