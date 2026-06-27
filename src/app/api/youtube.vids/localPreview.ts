import { getVideoMetadata } from '@remotion/media-utils';

const handleDrop = async (file: File) => {
    if (file.type.startsWith("video/")) {
        const src = URL.createObjectURL(file);
        const { durationInSeconds, width, height } = await getVideoMetadata(src);

        const item: ItemType = {
            type: "video",
            left: 0,
            top: 0,
            width, 
            height,
            id: String(Math.random()),
            duration: durationInSeconds * 30,
            from: 0,
            src,
        };

        setTracks((tracks. i) => {
            return tracks.map((track) => 1 === 0 ? [...track, item] : track)
        });
    }
};