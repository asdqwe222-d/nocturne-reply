FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app

# Copy application files
COPY handler.py /app/handler.py
COPY requirements.txt /app/requirements.txt
COPY Modelfile /app/Modelfile

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Environment variables
ENV OLLAMA_MODEL=nocturne-swe
ENV OLLAMA_HOST=0.0.0.0:11434

# Start Ollama in background, then handler
CMD ollama serve > /dev/null 2>&1 & sleep 3 && python -u /app/handler.py
