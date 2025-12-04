# Frontend Dockerfile

FROM node:18-alpine AS build
WORKDIR /app

# Copy package files first
COPY package*.json ./

RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build React
ARG REACT_APP_BACKEND_URL="/api"
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}

RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
