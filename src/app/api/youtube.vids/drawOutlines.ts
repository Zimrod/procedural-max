export const SelectionOutline: React.FC<{
    item: Item;
    selectedItem: string;
    setSelectedItem: Dispatch<SetActionState<string>>;
}> = ({item, selectedItem, setSelectedItem}) => {
    const [hovered, setHovered] = useState(false);
    const showOutline = hovered || selectedItem === item.id;

    return (
        <div
            onPointerEnter={() => setHovered(true)} 
            onPointerLeave={() => setHovered(false)} 
            onPointerDown={e => {
                e.stopPropagation()
                setSelectedItem(item.id)
            }} 
            style={
                position: 'absolute',
                left: item.left,
                top: item.top,
                width: item.width,
                height: item.height,
                outline: item.showOutline && '4px solid #0b84f3'
            }
        />
    );
}