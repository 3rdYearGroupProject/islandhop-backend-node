# Dockerfile

# 1. Use official Node.js base image
FROM node:20-alpine

# 2. Set the working directory
WORKDIR /app

# 3. Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# 4. Copy rest of the code
COPY . .

# 5. Expose port (must match the one used in your Express app)
EXPOSE 5000

# 6. Start the app
CMD ["node", "src/index.js"]
