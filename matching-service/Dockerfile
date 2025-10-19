# Small, modern Node image
FROM node:20-alpine AS base
WORKDIR /app

# Install only prod deps using clean cache
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src
COPY src/topicFamilies.json ./src/topicFamilies.json

# Set env & port
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# (Optional) run as non-root
RUN addgroup -S app && adduser -S app -G app
USER app

# Start server
CMD ["node", "src/server.js"]
