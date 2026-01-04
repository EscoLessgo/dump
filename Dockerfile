FROM node:20-slim

# Install system dependencies if needed (e.g. for native modules)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files often to cache dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Expose port (Railway sets PORT env var, but good practice)
EXPOSE 3000

# Start command
CMD ["npm", "start"]
