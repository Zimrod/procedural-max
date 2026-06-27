<div>
    {pages.map((page, index) => {
        const nextPage =pages[index + 1] ?? null;
        const subtitleStartFrame = (page.startMs / 1000) * fps;
        const subtitleEndFrame = Math.min(
            nextPage ? (nextPage.startMs / 1000) * fps : Infinity,
            subtitleStartFrame + 1200
        );
        const durationInFrames = subtitleEndFrame - subtitleStartFrame;

        return (
            <Sequence
                key={index}
                from={subtitleStartFrame}
                durationInFrames={durationInFrames}
            >
                <SubtitlePage 
                    page={page}
                    captionWidth={item.width}
                    key={index}
                />
            </Sequence>
        );
    })}
</div>