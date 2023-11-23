FROM node:18.14-alpine3.16 as builder

ENV NODE_ENV build

WORKDIR /home/node

COPY . /home/node

RUN yarn install
RUN yarn prisma generate
RUN yarn build

# ---

FROM node:18.14-alpine3.16

ENV NODE_ENV production

# Install Doppler CLI
RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
    apk add doppler

USER node
WORKDIR /home/node

COPY --from=builder /home/node/package*.json /home/node/
COPY --from=builder /home/node/node_modules/ /home/node/node_modules/
COPY --from=builder /home/node/dist/ /home/node/dist/

CMD ["doppler", "run", "--", "node", "dist/src/main"]