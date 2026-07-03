"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVoiceover = generateVoiceover;
const openai_1 = require("../lib/openai");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function generateVoiceover(script) {
    const speech = await openai_1.openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: script,
    });
    const buffer = Buffer.from(await speech.arrayBuffer());
    const outputPath = path_1.default.join(process.cwd(), "tmp", "generated_voiceover.mp3");
    fs_1.default.mkdirSync(path_1.default.dirname(outputPath), { recursive: true });
    fs_1.default.writeFileSync(outputPath, buffer);
    return outputPath;
}
//# sourceMappingURL=voiceoverGenerator.js.map