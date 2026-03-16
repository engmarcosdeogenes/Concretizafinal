FROM node:20-bookworm

# Instala ferramentas básicas de Linux e Git
RUN apt-get update && apt-get install -y git curl python3 make g++

# Instala o Claude Code globalmente
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /workspace