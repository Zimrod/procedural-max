export const RenderTrack: React.FC<{
    track: Track;
}> = ({track}) => {
    return track.items.map((item, i) => {
        return <RenderItem key={item.id} item={item} />
    });
}