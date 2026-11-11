FROM node:20-bookworm-slim AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
COPY package.json package-lock.json* ./
COPY client/package.json client/
RUN npm ci --workspace=@sid-software-solutions/client --include-workspace-root=false 2>/dev/null || npm install --workspace=@sid-software-solutions/client
COPY client ./client
COPY package.json ./
RUN npm run build -w @sid-software-solutions/client

FROM nginx:1.27-alpine AS runtime
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1
USER nginx
CMD ["nginx", "-g", "daemon off;"]
