# FROM node:22-alpine AS builder

# WORKDIR /app

# COPY package.json yarn.lock ./

# RUN yarn install

# COPY . .

# RUN yarn build

# FROM node:22-alpine

# WORKDIR /app

# COPY package.json yarn.lock ./

# RUN yarn install --production

# COPY --from=builder /app/dist ./dist
# # Copy .env.example as a fallback or template; actual envs should be injected
# COPY .env.example .env.example

# EXPOSE 3000

# CMD ["node", "dist/server.js"]


# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json yarn.lock ./

# Install all dependencies (including devDependencies)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Copy dependency definitions
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy .env.example (optional, but ensure your app handles missing .env gracefully)
COPY .env.example .env.example

# Security: Change ownership to the 'node' user
RUN chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 3000

# Use 'node' directly to avoid signal wrapping issues, or use 'tini' if needed
CMD ["node", "dist/server.js"]