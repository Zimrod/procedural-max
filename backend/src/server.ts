// backend/src/server.ts
import Fastify from "fastify";

const app = Fastify();

app.get("/", async () => {
  return { ok: true };
});

await app.listen({
  host: "0.0.0.0",
  port: Number(process.env.PORT) || 3001,
});