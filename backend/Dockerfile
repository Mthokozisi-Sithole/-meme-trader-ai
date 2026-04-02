FROM python:3.11-slim AS base

WORKDIR /app

# Install system deps + debugging tools (curl, wget, netcat)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    curl wget netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
