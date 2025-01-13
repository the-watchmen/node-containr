ARG fromImage=node:23.6.0-bookworm-slim
FROM $fromImage AS base

# https://stackoverflow.com/a/65588785
#
COPY --from=docker:27.4.1-cli /usr/local/bin/docker /usr/local/bin/

ARG entrypoint=node
ENV entrypoint=$entrypoint

ENV appPath=/app
WORKDIR $appPath

ARG cmd=src/index.js
ENV cmd=$cmd

COPY . .

#
FROM base AS dev
RUN \
    npm install --include=dev
CMD npm run dev

# https://stackoverflow.com/a/58752370
#
FROM scratch AS lock
COPY --from=dev /app/package-lock.json package-lock.json

#
FROM base AS test
ARG testParams=''
ENV testParams=$testParams
ENV NODE_ENV=test
RUN \
    npm ci --include=dev &&\
    chmod 777 node_modules ${appPath}
# CMD ["sh", "-c", "npm run _ava -- **/ava/mount.test.js"]
CMD ["sh", "-c", "npm test"]
#
FROM base AS prod
RUN npm ci --omit=dev

CMD $entrypoint $cmd