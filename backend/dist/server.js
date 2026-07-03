"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const script_js_1 = __importDefault(require("./routes/script.js"));
const voiceover_js_1 = __importDefault(require("./routes/voiceover.js"));
const scene_js_1 = __importDefault(require("./routes/scene.js"));
const app = (0, fastify_1.default)({
    logger: true,
});
app.register(script_js_1.default, {
    prefix: "/generate-script",
});
app.register(voiceover_js_1.default, {
    prefix: "/generate-voiceover",
});
app.register(scene_js_1.default, {
    prefix: "/captions",
});
const PORT = Number(process.env.PORT) || 3001;
app.listen({
    host: "0.0.0.0",
    port: PORT,
});
//# sourceMappingURL=server.js.map