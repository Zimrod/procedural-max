"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateScript = generateScript;
const openai_1 = require("../lib/openai");
async function generateScript(prompt) {
    const completion = await openai_1.openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
            {
                role: "system",
                content: `
Generate concise 30–40 second finance explainer scripts.

Tone:
- professional
- cinematic
- investor-focused
- concise

Avoid markdown.
`,
            },
            {
                role: "user",
                content: prompt,
            },
        ],
    });
    return (completion.choices[0].message.content ?? "");
}
//# sourceMappingURL=scriptGenerator.js.map