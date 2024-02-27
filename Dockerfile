#FROM node:21.5.0-alpine3.15
#ENV NODE_ENV=production
FROM node:hydrogen-slim

WORKDIR /app

#COPY ["package.json", "package-lock.json*", "./"]
COPY . .

RUN npm ci

EXPOSE 5000

CMD ["node", "src/server.js"]
