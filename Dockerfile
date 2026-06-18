FROM node:20-slim

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 5173 (Vite dev server default port)
EXPOSE 5173

# Start development server with host flag to allow external connections
CMD ["npm", "run", "dev", "--", "--host"]