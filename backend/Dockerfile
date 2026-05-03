FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY controllers ./controllers
COPY middleware ./middleware
COPY models ./models
COPY routes ./routes
COPY services ./services
COPY server.js ./

EXPOSE 80
CMD ["node", "server.js"]
