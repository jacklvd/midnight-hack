# TruthLens Midnight sidecar — Hugging Face Space (Docker SDK)
# Hosts the Express HTTP service that drives the TruthLens Compact contract.

FROM node:22-slim

ENV NODE_ENV=production \
    YARN_CACHE_FOLDER=/tmp/.yarn-cache

WORKDIR /app

# Install deps with dev tooling included (tsx is a devDependency we run at start).
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false \
    && rm -rf "$YARN_CACHE_FOLDER"

# Compiled Compact artifacts (src/managed/truthlens/) are committed to git,
# so we don't need the Compact compiler at build time.
COPY tsconfig.json ./
COPY src ./src

# HF Spaces sets PORT to match app_port from README frontmatter.
# Default to 7860 for local docker runs.
ENV PORT=7860 \
    MIDNIGHT_MODE=simulator
EXPOSE 7860

CMD ["yarn", "sidecar"]
