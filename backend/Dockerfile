FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# Clean production install
RUN npm ci

COPY . .

# Compiles TypeScript into JavaScript inside the /app/dist directory
RUN npm run build

# Dynamically fall back to 8080 if PORT isn't provided
ENV PORT=8080
EXPOSE 8080

# Run Node directly as PID 1 to capture shutdown signals perfectly
CMD ["node", "dist/server.js"]