# Stage 1: Build React + Tailwind (Vite + TypeScript) app
FROM node:20-alpine AS build
WORKDIR /app

# Accept API URL at build time
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

# Install dependencies (works even if package-lock.json is missing)
COPY package.json ./
RUN npm install --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build -- --base=/adcraftaifestage/

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default config to avoid conflicts
RUN rm /etc/nginx/conf.d/default.conf

# Copy build output (Vite defaults to /dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the application port
EXPOSE 8030

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
