# --- 1) Builder stage ---
FROM node:18-alpine AS builder

WORKDIR /app

# Install all dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application sources
COPY . .

# (If you have a build/transpile step, add it here, e.g. `RUN npm run build`)

# --- 2) Production stage ---
FROM node:18-alpine

# Provide a human-readable description for the image
LABEL org.opencontainers.image.description="Fusion Electronics Backend – a backend server for Fusion Electronics, a MERN-stack e-commerce website."

WORKDIR /app

# Bring in only the production deps
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --only=production

# Copy source & any build output
COPY --from=builder /app ./

# Expose the port your app listens on
EXPOSE 3000

# Start your app
CMD ["node", "index.js"]
