FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV AWS_REGION=us-east-2
CMD [ "node", "index.js" ]