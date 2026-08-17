// backend/src/index.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyMultipart from '@fastify/multipart';

import scriptRoutes from "./routes/script.js";
import voiceoverRoutes from "./routes/voiceover.js";
import sceneRoutes from "./routes/scene.js";
import renderRoutes from "./routes/render.js";
import captionsRoutesTemp from "./routes/captions-temp.js";

async function start() {
  // ✅ Use a single instance with bodyLimit set
  const app = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024, // 50 MB
  });

  // ✅ Register CORS
  await app.register(cors, {
    origin: true,
  });

  // ✅ Register multipart plugin BEFORE routes
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
      files: 1,
      parts: 10,
    },
  });

  // ✅ Routes
  await app.register(scriptRoutes);
  await app.register(voiceoverRoutes);
  await app.register(sceneRoutes);
  await app.register(renderRoutes);
  await app.register(captionsRoutesTemp);

  // Health checks
  app.get("/", async () => ({
    service: "Procedural Max Routes",
    status: "online",
  }));

  app.get("/health", async () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
  }));

  // Start server
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
}

start();