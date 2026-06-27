<div>
    {selectedItem.type === "image" ? (
        <ImgInspector item={item} />
    ) : null}
    {selectedItem.type === "video" ? (
        <VideoInspector item={item} />
    ) : null}
    {selectedItem.type === "audio" ? (
        <AudioInspector item={item} />
    ) : null}
</div>