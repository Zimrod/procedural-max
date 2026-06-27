import React from 'react';
 
export const LoopButton: React.FC<{
  loop: boolean;
  setLoop: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({loop, setLoop}) => {
  const onClick = React.useCallback(() => {
    setLoop((prev) => !prev);
  }, [setLoop]);
 
  return (
    <button type="button" onClick={onClick}>
      {loop ? 'Loop enabled' : 'Loop disabled'}
    </button>
  );
};