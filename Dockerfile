FROM public.ecr.aws/bitnami/node:14.17.3-prod AS starter

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
