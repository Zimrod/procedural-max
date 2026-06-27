const changeItem = useCallback(
    (itemId: string, updater: (item: Item) => Item) => {
        setTracks(tracks => {
            return tracks.map(track => {
                return {
                    ...track,
                    items: track.items.map((_item) => {
                        if (_item.id !== itemId) {
                            return _item;
                        }

                        return updater(_item);
                    });
                }
            });
        });
    }
);

changeItem(item.id, 1 => {
    return {
        ...i,
        left: i.left + 100
    }
});