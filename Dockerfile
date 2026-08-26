# The wizard: a static bundle plus three API routes, both built here and served by one
# small Node process. Two stages so the toolchain and node_modules stay out of the image
# that actually runs.

FROM node:20-slim AS build
WORKDIR /app

# Dependencies first, so editing source does not re-install on every build.
COPY package.json package-lock.json ./
RUN npm ci

# Everything the two builds read: the wizard, the composition it renders, the server
# handlers, and the configs that tie them together.
COPY tsconfig.json vite.config.ts ./
COPY scripts ./scripts
COPY server ./server
COPY src ./src
COPY web ./web
COPY public ./public

# `wizard:build` emits build/web (the app; public/ is NOT copied in — see vite.config.ts)
# and `build:server` bundles the handlers to a single ESM file with sirv inlined.
RUN npm run build:deploy

# --- runtime -------------------------------------------------------------------------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# No node_modules: the server bundle carries its one dependency. The layout matches what
# server/prod.ts resolves relative to itself — index.mjs with web/ and public/ beside it.
COPY --from=build /app/build/server/index.mjs ./index.mjs
COPY --from=build /app/build/web ./web
COPY --from=build /app/public ./public

# Drop root. The process only ever reads these files.
USER node

EXPOSE 8080
CMD ["node", "index.mjs"]
