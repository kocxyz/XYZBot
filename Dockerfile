FROM node:20-alpine3.17

WORKDIR /opt
COPY . .

RUN npm i && \
  npx tsc

ENTRYPOINT ["node", "/opt/src/index.js"]