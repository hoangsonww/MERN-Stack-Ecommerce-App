# 1) Build stage — compile the React app
FROM node:18-alpine AS builder

LABEL org.opencontainers.image.description="Fusion Electronics Ecommerce Website frontend – a React SPA built with Material-UI, React-Router, Stripe integration and more."

WORKDIR /app

# Install deps
COPY . .
RUN npm ci

# Copy sources and build
COPY public ./public

COPY src    ./src

RUN npm run build

# 2) Production stage — serve static build via nginx
FROM nginx:alpine

# Provide a human-readable description for the image
LABEL org.opencontainers.image.description="Fusion Electronics Frontend – a React SPA built with Material-UI, React-Router, Stripe integration and more."

WORKDIR /usr/share/nginx/html

# Remove default content, then copy in our build
RUN rm -rf ./*
COPY --from=builder /app/build ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
