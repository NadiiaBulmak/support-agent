FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY prisma ./prisma
COPY prisma7.config.ts nest-cli.json tsconfig*.json ./.prettierrc ./
COPY src ./src

RUN npm run prisma:generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts

EXPOSE 3000

CMD ["node", "dist/main.js"]