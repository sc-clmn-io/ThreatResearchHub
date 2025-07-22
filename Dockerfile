# Use Node.js 20 as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for PDF processing and other utilities
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=sqlite:///app/data/threatresearchhub.db

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Start the application
CMD ["npm", "start"]