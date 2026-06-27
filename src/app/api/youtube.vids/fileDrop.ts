import { handleDrop } from "./handle-drop";

export const DropHandler: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const onDragOver: React.DragEventHandler = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
    }, []);

    const onDrop: React.DragEventHandler = useCallback(async (e) => {
        e.preventDefault();

        for (const file of e.dataTransfer.files) {
            await handleDrop(file);
        }
    }, []);

    return (
        <AbsoluteFill onDragOver={onDragOver} onDrop={onDrop}>
            {children}
        </AbsoluteFill>
    );
};