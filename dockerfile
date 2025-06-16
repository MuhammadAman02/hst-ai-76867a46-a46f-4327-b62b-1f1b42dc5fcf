# Build stage
FROM python:3.10-slim AS builder

WORKDIR /app

# Install build dependencies (if any are needed for your specific packages)
# For a basic FastAPI app with the current requirements.txt, these might not be strictly necessary.
# RUN apt-get update && \
#     apt-get install -y --no-install-recommends gcc python3-dev && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir wheel setuptools && \
    pip wheel --no-cache-dir --wheel-dir=/app/wheels -r requirements.txt

# Final stage
FROM python:3.10-slim

WORKDIR /app

# Copy wheels from builder stage
COPY --from=builder /app/wheels /app/wheels

# Install dependencies from wheels
RUN pip install --no-cache-dir --no-index --find-links=/app/wheels/ /app/wheels/* && \
    rm -rf /app/wheels

# Copy application code
# Copy the app directory and the main.py, requirements.txt, etc.
COPY app /app/app
COPY main.py requirements.txt fly.toml /app/
# If you have other root-level files or directories to include, add them here.
# Example: COPY .env.example /app/.env.example

# Ensure all necessary files from the root are copied if needed by the app
# The COPY . . command was broad; be more specific if possible.
# For this minimal setup, we'll copy the essential files explicitly.
# If your .env file contains secrets, consider using Docker secrets or build args instead of copying it directly.


EXPOSE 8000

# Run the NiceGUI application
# main.py now calls ui.run() which handles Uvicorn internally.
# Host and port are configured in main.py based on environment variables.
CMD ["python", "main.py"]