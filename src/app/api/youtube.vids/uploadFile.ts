const res - await fetch("/api/upload", {
    method: "POST",
    body: JSON.stringify({
        size: file.size,
        contentType: file.type,
    }),
});

const { presignedUrl } = await res.json();

await fetch(presignedUrl, {
    method: 'PUT',
    body: await file.arrayBuffer(),
    headers: {
        'content-type': file.type,
    },
});