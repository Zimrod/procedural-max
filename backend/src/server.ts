// backend/src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";

import scriptRoutes from "./routes/script.js";
import voiceoverRoutes from "./routes/voiceover.js";
import sceneRoutes from "./routes/scene.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

await app.register(scriptRoutes);
await app.register(voiceoverRoutes);
await app.register(sceneRoutes);

app.get("/", async () => ({
  service: "Procedural Max Routes",
  status: "online",
}));

app.get("/health", async () => ({
  status: "healthy",
  timestamp: new Date().toISOString(),
}));

try {
  await app.listen({
   port: Number(process.env.PORT) || 3001,
   host: "0.0.0.0",
  });

  console.log("Backend listening");
} catch (err) {
  console.error(err);
  process.exit(1);
}
