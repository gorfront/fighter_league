# # Build stage
# FROM node:22-alpine AS builder

# WORKDIR /app

# COPY package.json yarn.lock ./

# RUN yarn install

# COPY . .

# # Build variable can be passed here if needed, but we'll rely on .env or default
# RUN yarn build

# # Production stage
# FROM nginx:alpine

# COPY --from=builder /app/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# --- DEFINE BUILD ARGUMENTS ---
ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_FIGHTER_IMAGES
ARG VITE_SUPABASE_DONOR_IMAGES
ARG VITE_SUPABASE_SPONSOR_IMAGES

# --- MAP ARGS TO ENV VARS ---
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_FIGHTER_IMAGES=$VITE_SUPABASE_FIGHTER_IMAGES
ENV VITE_SUPABASE_DONOR_IMAGES=$VITE_SUPABASE_DONOR_IMAGES
ENV VITE_SUPABASE_SPONSOR_IMAGES=$VITE_SUPABASE_SPONSOR_IMAGES

RUN yarn build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]