# TruthLens FastAPI backend — Hugging Face Space (Docker SDK)
# Pre-downloads the deepfake classifier at build time so cold starts are fast.

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/app/.cache/huggingface \
    TRANSFORMERS_CACHE=/app/.cache/huggingface

# libgomp1: torch runtime dep on slim. curl: lets HF Spaces health-check the container.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Bake the model into the image so the first request doesn't pay a 350 MB download.
ARG HF_MODEL_NAME=dima806/deepfake_vs_real_image_detection
RUN python -c "from transformers import pipeline; pipeline('image-classification', model='${HF_MODEL_NAME}')"

COPY app ./app

# HF Spaces sets PORT (default 7860). Honor it; fall back for local docker runs.
ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
