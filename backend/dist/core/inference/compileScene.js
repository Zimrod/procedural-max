"use strict";
// src/core/inference/compileScene.ts
//
// Top-level pipeline function.
// Takes a SceneConfig (prompt + seed) and returns everything Puppeteer needs.
//
// Usage:
//   const compiled = compileScene({ prompt, seed: 42 });
//   <Puppeteer entities={compiled.entities} timeline={compiled.timeline} constraints={compiled.constraints} />
//
// Change seed → different video, same narrative intent.
// Change prompt → different scene entirely.
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileScene = void 0;
const resolveIntent_1 = require("./resolveIntent");
const generateLayout_1 = require("./generateLayout");
const generateAnimation_1 = require("./generateAnimation");
const worldLayout_1 = require("../world/worldLayout");
const compileScene = (config) => {
    const { prompt, seed } = config;
    // Stage 2: resolve intent from prompt
    const intent = (0, resolveIntent_1.resolveIntent)(prompt);
    // Stage 3: generate environment layout
    const worldLayout = (0, generateLayout_1.generateLayout)(intent, seed);
    const rawEnvEntities = (0, worldLayout_1.buildWorldLayout)(worldLayout);
    const envEntities = (0, worldLayout_1.sortByDepth)((0, worldLayout_1.applyDepthScaling)(rawEnvEntities, 0.75));
    // Stage 4: generate animation entities + timeline
    const animation = (0, generateAnimation_1.generateAnimation)(intent, seed);
    // Combine — environment renders behind actors (lower zIndex)
    const entities = [
        ...envEntities,
        ...animation.entities,
    ];
    return {
        entities,
        timeline: animation.timeline,
        constraints: animation.constraints,
        skyColor: intent.skyColor,
        groundColor: intent.groundColor,
    };
};
exports.compileScene = compileScene;
//# sourceMappingURL=compileScene.js.map