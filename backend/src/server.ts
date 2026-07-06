// backend/src/server.ts
import Fastify from "fastify";

const app = Fastify();

// Minimal health check endpoint
app.get("/health", async () => {
  return { status: "healthy" };
});

const port = Number(process.env.PORT) || 8080;

try {
  await app.listen({
    port: port,
    host: "0.0.0.0",
  });
  console.log(`PING_TEST: Server listening on 0.0.0.0:${port}`);
} catch (err) {
  console.error("PING_TEST_ERROR:", err);
  process.exit(1);
}