# Stage 1: Build the React/Vite application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the frontend (Vite)
# ARG is used so we can pass VITE_API_URL during docker build/compose
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# docker build --build-arg VITE_API_URL=/api -t sarvnoorkaur/ragpdf-frontend:latest ./company-policy-ai/frontend
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Add a custom nginx configuration to handle React client-side routing
# This prevents 404 errors when refreshing on a route like /dashboard
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
