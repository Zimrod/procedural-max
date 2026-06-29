import React, { useMemo, useState, useEffect } from 'react';
import {Player} from '@remotion/player';
import type {Item} from './types';
import {Main} from './Main';
 
type Track = {
  name: string;
  items: Item[];
};
 
// export const Editor = () => {
//   const [tracks, setTracks] = useState<Track[]>([
//     {
//       name: "Captions",
//       items: [
//         {
//           type: "captions",
//           id: "captions-1",
//           from: 0,
//           durationInFrames: 300,
//           captions: transcription.words, // from state
//           tone: "financial",
//         },
//       ],
//     },
//     {
//       name: "Background",
//       items: [
//         {
//           type: "solid",
//           id: "bg-1",
//           from: 0,
//           durationInFrames: 600,
//           color: "#ffffff",
//         },
//       ],
//     },
//   ]);
 
//   const inputProps = useMemo(() => {
//     return {
//       tracks,
//     };
//   }, [tracks]);
 
//   return (
//     <>
//       <Player
//         component={Main}
//         inputProps={{ tracks }}
//         durationInFrames={600}
//         compositionWidth={1080}
//         compositionHeight={1920}
//         fps={30}
//       />
//     </>
//   );
// };

// Editor.tsx
export const Editor = () => {
    const [tracks, setTracks] = useState<Track[]>([
      {name: 'Lottie Track', items: []},
      {name: 'Caption Track', items: []},
    ]);
  
    // Your existing metadata state
    const [metadata, setMetadata] = useState<Record<string, any>>({});
    
    useEffect(() => {
      fetch("/api/metadata")
        .then(res => res.json())
        .then(setMetadata)
        .catch(console.error);
    }, []);
  
    const addLottieAnimation = (lottieFile: any, fileName: string) => {
      const meta = metadata[fileName];
      setTracks(prev => {
        const newTracks = [...prev];
        const lottieTrack = newTracks.find(t => t.name === 'Lottie Track') || newTracks[0];
        
        lottieTrack.items.push({
          type: 'lottie',
          animationData: lottieFile,
          from: 0, // Calculate proper position
          durationInFrames: (meta?.duration ?? 6) * 30, // Using your fps
          id: `lottie-${Date.now()}`,
          loop: meta?.duration < 3 // Auto-loop short animations
        });
        
        return newTracks;
      });
    };
  
    const inputProps = useMemo(() => ({
      tracks,
      // Include your existing caption props
      fontSize: 48,
      fontFamily: 'Arial',
      captions: [] // Your captions data
    }), [tracks]);
  
    return (
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <Player 
          component={Main} 
          fps={30} 
          inputProps={inputProps} 
          durationInFrames={600} 
          compositionWidth={1280} 
          compositionHeight={720} 
        />
        
        {/* Your existing UI for uploading Lottie files */}
        <button onClick={() => addLottieAnimation(catsKissingLottie, 'cats-kissing.json')}>
          Add Cats Kissing Animation
        </button>
        
        {/* Basic timeline controls */}
        <div style={{marginTop: 20}}>
          {tracks.map(track => (
            <div key={track.name} style={{marginBottom: 10}}>
              <h3>{track.name}</h3>
              {track.items.map(item => (
                <div key={item.id} style={{
                  display: 'inline-block',
                  marginRight: 10,
                  padding: 5,
                  border: '1px solid #ccc'
                }}>
                  {item.type} ({item.durationInFrames}f)
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };