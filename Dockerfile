FROM ollama/ollama:latest

# Install Python och dependencies
RUN apt-get update && apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY handler.py /app/handler.py
COPY requirements.txt /app/requirements.txt

RUN pip3 install --no-cache-dir runpod requests

# Set environment variables
ENV OLLAMA_MODEL=nocturne-swe
ENV OLLAMA_HOST=0.0.0.0:11434

# Start Ollama i bakgrunden och sedan handler
CMD sh -c "ollama serve & sleep 5 && python3 /app/handler.py"