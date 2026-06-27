export type Track = {
    items: Items[];
}

const [tracks, setTracks] = useState([
    {
        type: "video",
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        from: 0,
        duration: 100,
        id: '1'
    }
]);