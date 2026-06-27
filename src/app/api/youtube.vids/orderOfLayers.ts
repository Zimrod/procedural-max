export const Main: React.FC = () => {
    const [tracks] = useState<Track>([]);

    const {unselected, selected} = sortOutlines(tracks);

    return (
        <AbsoluteFill>
            <Tracks tracks={tracks} />
            {unselected.map(outline => {
                return <SelectionOutline outline={outline} />;
            })}
            {selected && (
                <SelectionOutline outline={selected} />
            )}
        </AbsoluteFill>
    );
}