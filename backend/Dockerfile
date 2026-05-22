FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
	RUNNING_IN_DOCKER=true \
	PORT=3000

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["npm", "start"]