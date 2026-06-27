<div>
    {pages.tokens.map((t) => {
        const startRelativeToSequence = t.fromMs - page.startMs;
        const endRelativeToSequence = t.toMs - page.startMs;

        const active = 
            startRelativeToSequence <= timeInMs &&
            endRelativeToSequence > timeInMs;

        return (
            <span
                key={t.fromMs + t.text}
                style={{
                    display: "inline",
                    whitespace: "pre",
                    color: active ? "#39e508" : "white",
                }}
            >
                {t.text}
            </span>
        );
    })}
</div>