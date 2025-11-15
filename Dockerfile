FROM python:3.10-slim

# Install system dependencies och Ollama
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app
COPY handler.py /app/handler.py
COPY requirements.txt /app/requirements.txt
COPY Modelfile /app/Modelfile

# Install Python dependencies
RUN pip install --no-cache-dir runpod requests

# Set environment variables
ENV OLLAMA_MODEL=nocturne-swe
ENV OLLAMA_HOST=0.0.0.0:11434

# Expose Ollama port
EXPOSE 11434

# Start Ollama and handler
CMD ["sh", "-c", "ollama serve > /tmp/ollama.log 2>&1 & sleep 10 && python /app/handler.py"]