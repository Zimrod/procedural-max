import { 
  useCurrentFrame, 
  useVideoConfig, 
  interpolate, 
  spring, 
  AbsoluteFill 
} from 'remotion';

// Hypothetical coordinates based on your SVG exports
const PIVOT_WORLD = { x: 400, y: 300 }; // pivot_ground
const PIVOT_AFRICA_IN_WORLD = { x: 420, y: 350 }; // pivot_ground_africa (position in world map)
const PIVOT_AFRICA_SELF = { x: 100, y: 150 }; // pivot_ground_africa (position in solo SVG)

export const MapOutlineRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 1. Reveal (Draw lines)
  const reveal = spring({ frame, fps, config: { damping: 20 }, durationInFrames: 40 });

  // 2. Zoom & Transition (Start at frame 50)
  const zoom = spring({ frame: frame - 50, fps, config: { stiffness: 60 } });

  // Calculate the shift to align solo Africa with the world map's Africa position
  const offsetX = PIVOT_AFRICA_IN_WORLD.x - PIVOT_AFRICA_SELF.x;
  const offsetY = PIVOT_AFRICA_IN_WORLD.y - PIVOT_AFRICA_SELF.y;

  // Animation values
  const scale = interpolate(zoom, [0, 1], [1, 3]);
  const worldOpacity = interpolate(zoom, [0, 0.4], [1, 0]);
  const africaColorProgress = interpolate(zoom, [0.4, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: `${PIVOT_AFRICA_IN_WORLD.x}px ${PIVOT_AFRICA_IN_WORLD.y}px` }}>
        
        {/* Layer 1: Rest of World */}
        <svg viewBox="0 0 800 600" width={800} height={600} style={{ position: 'absolute', opacity: worldOpacity }}>
          <path
            d="..." // rest_of_world path
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeDasharray={1000}
            strokeDashoffset={1000 * (1 - reveal)}
          />
        </svg>

        {/* Layer 2: Africa (Aligned via pivots) */}
        <svg 
          viewBox="0 0 200 300" 
          width={200} 
          height={300} 
          style={{ 
            position: 'absolute', 
            left: offsetX, 
            top: offsetY 
          }}
        >
          <path
            d="..." // africa path
            fill={interpolate(africaColorProgress, [0, 1], ["transparent", "#FFD700"])}
            stroke={africaColorProgress > 0.5 ? "#FF8C00" : "white"}
            strokeWidth="1"
            strokeDasharray={1000}
            strokeDashoffset={1000 * (1 - reveal)}
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};