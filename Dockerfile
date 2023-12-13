FROM --platform=linux/amd64 node:alpine3.18 AS starter

CMD mkdir -p /home/node/dd-proxy-api
WORKDIR /home/node/dd-proxy-api

COPY . .

RUN npm ci

# ---------------------------------------------

FROM starter AS runner

ENV HOST 0.0.0.0

WORKDIR /home/node/dd-proxy-api
COPY --from=starter /home/node/dd-proxy-api .

EXPOSE 3000

CMD ["npm", "start"]
