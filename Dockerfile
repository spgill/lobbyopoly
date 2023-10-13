FROM python:3.11-slim-bookworm
SHELL ["/bin/bash", "-c"]

# Add Tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini

# Copy source into image
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
ENV SESSION_SECRET_KEY="42"

# Default TCP port
EXPOSE 5000/tcp

# Run the server
ENTRYPOINT ["/tini", "-v", "--", "./docker-entrypoint.sh"]
