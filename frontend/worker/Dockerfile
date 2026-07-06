FROM ghcr.io/remotion-dev/template-alfred:main

WORKDIR /app

# Copy dependency records
COPY package.json ./
RUN npm install

# Copy application files
COPY . .

EXPOSE 8080

CMD ["node", "server.js"]