# RunPod Serverless Dockerfile for Ollama
FROM runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set working directory
WORKDIR /app

# Copy handler
COPY handler.py /app/handler.py

# Install Python dependencies
RUN pip install --no-cache-dir \
    runpod \
    requests

# Set environment variables
ENV OLLAMA_MODEL=nocturne-swe
ENV OLLAMA_HOST=0.0.0.0:11434

# Expose Ollama port
EXPOSE 11434

# Start Ollama and handler
CMD ["python", "/app/handler.py"]

