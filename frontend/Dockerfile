# ========================
# Build stage
# ========================
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline

# Copy source
COPY . .

# Build for production
RUN npm run build:prod

# ========================
# Runtime stage (nginx)
# ========================
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy built Angular app
COPY --from=builder /app/dist/smart-trial-room/browser/ .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
