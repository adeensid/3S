FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server/package.json server/
RUN npm ci --workspace=@sid-software-solutions/server --include-workspace-root=false 2>/dev/null || npm install --workspace=@sid-software-solutions/server
COPY server ./server
COPY package.json ./
RUN npm run build -w @sid-software-solutions/server

FROM node:20-bookworm-slim AS runtime
RUN groupadd --gid 1001 nodeapp && useradd --uid 1001 --gid nodeapp --create-home nodeapp
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY server/package.json server/
RUN npm ci --workspace=@sid-software-solutions/server --omit=dev --include-workspace-root=false 2>/dev/null || npm install --workspace=@sid-software-solutions/server --omit=dev
COPY --from=build /app/server/dist ./server/dist
USER nodeapp
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
WORKDIR /app/server
CMD ["node", "dist/index.js"]
