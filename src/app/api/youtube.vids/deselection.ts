export const Main: React.FC = () => {    
    const [selectedItem, setSelectedItem] = 
    useState<string | null>(null);

    const onPointerDown = useCallback(() => {
        // Any event that has not been stopped
        // using e.stoPropagation() wil fall through
        setSelectedItem(null);
    }, []);
    
    return (
        <AbsoluteFill>
            <AbsoluteFill onPointerDown={onPointerDown}>
                <Tracks />
            </AbsoluteFill>
            <AbsoluteFill>
                <Outlines />
            </AbsoluteFill>
        </AbsoluteFill>
    );
}