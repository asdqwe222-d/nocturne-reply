FROM runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel

# Install Ollama (required for handler.py)
RUN curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app
COPY handler.py /app/handler.py
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir runpod requests

# Set environment variables
ENV OLLAMA_MODEL=nocturne-swe
ENV OLLAMA_HOST=0.0.0.0:11434

CMD ["python", "/app/handler.py"]