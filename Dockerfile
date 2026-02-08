FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.29.5-alpine3.23
COPY --from=builder /app/dist/* /usr/share/nginx/html/
