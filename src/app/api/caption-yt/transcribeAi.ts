export const POST = () => {
    const blob = await request.blob();

    const body = new FormData();
    body.append("file", blob);
    body.append("model", "whisper-1");
    body.append("response_format", "verbose_json");
    body.append("prompt", "Today is the best day of my life.");
    body.append("timestamp_granularities", "word");

    const res = 
    await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
        },
        body,
    });
};