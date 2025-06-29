FROM functionstream/fs-python-base

WORKDIR /function

# Install build dependencies for jsonnet-python
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt /function/

# Install Python dependencies
RUN pip install -r requirements.txt

# Copy application code
COPY . /function/

CMD ["python", "/function/main.py"]