// backend/src/server.ts
import Fastify from "fastify";

import scriptRoute from "./routes/script.js";
import voiceoverRoute from "./routes/voiceover.js";
import sceneRoute from "./routes/scene.js";

const app = Fastify({
  logger: true,
});

app.register(scriptRoute, {
  prefix: "/generate-script",
});

app.register(voiceoverRoute, {
  prefix: "/generate-voiceover",
});

app.register(sceneRoute, {
  prefix: "/captions",
});

app.get("/", async () => {
  return {
    service: "Procedural Max Routes",
    status: "online",
  };
});

app.get("/health", async () => {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
  };
});

const PORT = Number(process.env.PORT) || 3001;

await app.listen({
  host: "0.0.0.0",
  port: Number(process.env.PORT) || 3001,
});