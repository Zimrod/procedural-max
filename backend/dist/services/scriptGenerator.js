import { openai } from "../lib/openai.js";
export async function generateScript(prompt) {
    const completion = await openai.chat.completions.create({
        model: "gpt-5.6-luna",
        messages: [
            {
                role: "system",
                content: `
                    Generate concise 30–40 second explainer scripts.

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