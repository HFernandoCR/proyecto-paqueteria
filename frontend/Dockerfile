# Este Dockerfile sirve para levantar el frontend en modo desarrollo de forma
# independiente. En producción, proxy/Dockerfile hace el build multi-stage
# y el resultado lo sirve Nginx directamente.

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
