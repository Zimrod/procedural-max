const res = await fetch('/api/captions', {
    method: "POST",
    headers: {
        "Content-Type": "audio/wav",
    },
    body: audio,
});

const json = (await res.json()) as Captions[];