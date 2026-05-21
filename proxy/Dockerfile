# ── Etapa 1: compilar el frontend ───────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copiar sólo manifiestos primero para aprovechar caché de capas
COPY frontend/package*.json ./
RUN npm ci

# Copiar el resto del código fuente y construir
COPY frontend/ .
RUN npm run build
# El resultado queda en /app/dist

# ── Etapa 2: nginx sirve los estáticos + actúa como reverse proxy ────────────
FROM nginx:alpine

# Copiar el build de React al directorio de nginx
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copiar la configuración del proxy
COPY proxy/nginx.conf /etc/nginx/conf.d/default.conf

# Eliminar la configuración por defecto de nginx
RUN rm -f /etc/nginx/conf.d/default.conf.bak

EXPOSE 8108

CMD ["nginx", "-g", "daemon off;"]
