FROM node:14.5.0-alpine

RUN apk add git bash

ARG UID=1001
RUN addgroup -g ${UID} -S appgroup && \
  adduser -u ${UID} -S appuser -G appgroup

WORKDIR /app

RUN chown appuser:appgroup /app

USER appuser

COPY --chown=appuser:appgroup package.json package-lock.json ./

ARG NPM_CMD='ci --ignore-optional --ignore-scripts'
RUN npm ${NPM_CMD}

COPY --chown=appuser:appgroup  . .

EXPOSE 3000
CMD [ "node", "bin/start.js" ]
