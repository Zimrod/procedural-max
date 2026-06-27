// Add this prop to the Player
<Player overflowVisible />

// Hide the overflow of the items
export const Main: React.FC = () => {
    const [tracks] = useState<Track>([]);

    return (
        <AbsoluteFill>
            <AbsoluteFill style={{overflow: "hidden"}}>
                <Tracks tracks={tracks} />
            </AbsoluteFill>
            <AbsoluteFill>
                <Outlines tracks={tracks} />
            </AbsoluteFill>
        </AbsoluteFill>
    );
}