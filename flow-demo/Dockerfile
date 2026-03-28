FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN node generate-pages.js

FROM nginx:alpine
COPY --from=builder /app/index.html /app/styles.css /app/app.js /usr/share/nginx/html/
COPY --from=builder /app/flow-*.html /usr/share/nginx/html/
EXPOSE 80
