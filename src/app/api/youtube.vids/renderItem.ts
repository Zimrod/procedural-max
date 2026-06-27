import {CSSProperties, useMemo, FC} from "react";
import {Img} from "remotion";
import {type Item} from "./items";

export const RenderItem: FC<{
    item: Item;
}> = ({item}) => {
    const style : CSSProperties = useMemo(() => {
        return {
            position: "absolute",
            width: item.width,
            height: item.height,
            top: item.top,
            left: item.left
        };
    }, [item]);

    if (item.type === "image") {
        return (
            <Img style={style} src={item.src} />
        );
    }

    if (item.type === "text") {
        return (
            <div style={style}>
                {item.text}
            </div>
        );
    }

    throw new Error('Unkown item type: $(item.type)')
}