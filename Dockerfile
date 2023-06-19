FROM python:3.10-slim-bullseye
SHELL ["/bin/bash", "-c"]

# Copy source code over from current dir
COPY . /tmp/lobbyopoly
WORKDIR /tmp/lobbyopoly

# Install minimal CLI utilities
RUN apt update && \
  apt -y install --no-install-recommends ca-certificates curl && \
  rm -rf /var/lib/apt/lists/* && \
  apt clean

# Install NVM and build web UI. After build, delete node modules and NVM because they aren't necessary at runtime.
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash && \
  source ~/.bashrc && \
  nvm install && \
  npm install && \
  npm run build && \
  rm -rf ./node_modules && \
  rm -rf ~/.nvm

# Install python dependencies
RUN pip install -r requirements.txt

# Environment vars
ENV MONGODB_HOST=""

# Default TCP port
EXPOSE 5000/tcp

# Command to start server
CMD ["honcho", "start", "web"]
