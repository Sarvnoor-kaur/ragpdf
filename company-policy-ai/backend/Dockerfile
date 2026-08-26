FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the backend source code
COPY . .

# Expose the port (5001 as defined in the project)
EXPOSE 5001

# Start the application using standard node command
CMD ["npm", "start"]
