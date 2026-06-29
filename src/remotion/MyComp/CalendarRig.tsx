// src/remotion/MyComp/CalendarRig.tsx
import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

type Props = {
  year: number;
  month: number; // 1 for January, 12 for December
  markedDay: number; // The day of the month to mark with an 'X'
  
  width?: number;
  primaryColor?: string; 
  textColor?: string;    
  accentColor?: string;  
  fontFamily?: string;
};

export const CalendarRig: React.FC<Props> = ({
  year,
  month,
  markedDay,
  width = 500,
  primaryColor = "#083569", 
  textColor = "#333333",
  accentColor = "#d93838",  
  fontFamily = "Ubuntu, sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const jsMonth = month - 1;

  const { monthName, daysArray, paddingDays } = useMemo(() => {
    const date = new Date(year, jsMonth, 1);
    const name = date.toLocaleString("default", { month: "long" });
    const startDayOfWeek = date.getDay();
    const totalDays = new Date(year, month, 0).getDate();

    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const padding = Array.from({ length: startDayOfWeek }, (_, i) => i);

    return { monthName: name, daysArray: days, paddingDays: padding };
  }, [year, jsMonth, month]);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const cellSize = width / 9;

  const r = 33;
  const circumference = 2 * Math.PI * r;
  const circleProgress = spring({
    frame,
    fps,
    config: { stiffness: 220, damping: 16 },
    delay: 10,
  });

  const dashOffset = interpolate(circleProgress, [0, 1], [circumference, 0]);

  return (
    <div
      style={{
        width,
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: 32,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        fontFamily,
        pointerEvents: "none",
      }}
    >
      {/* HEADER: MONTH & YEAR */}
      <div
        style={{
          fontSize: 45,
          fontWeight: 800,
          color: primaryColor,
          textAlign: "left",
          marginBottom: 24,
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {monthName} {year}
      </div>

      {/* CALENDAR GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          rowGap: 16,
          columnGap: 12,
          textAlign: "center",
        }}
      >
        {/* DAY COLUMNS HEADER */}
        {dayLabels.map((day, index) => (
          <div
            key={`label-${index}`}
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "rgba(0, 0, 0, 0.4)",
              paddingBottom: 8,
              borderBottom: "2px solid rgba(0, 0, 0, 0.05)",
            }}
          >
            {day}
          </div>
        ))}

        {/* EMPTY PADDING BLOCKS */}
        {paddingDays.map((_, index) => (
          <div key={`pad-${index}`} />
        ))}

        {/* ACTUAL DAYS */}
        {daysArray.map((day) => {
          const isMarked = day === markedDay;

          return (
            <div
              key={`day-${day}`}
              style={{
                height: cellSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: isMarked ? 800 : 500,
                color: isMarked ? primaryColor : textColor,
                position: "relative",
              }}
            >
              {/* Day Number text stays layered under cross via zIndex */}
              <span style={{ zIndex: 1 }}>{day}</span>

              {/* FIXED: Explicitly bounded and sized SVG layer */}
              {isMarked && (
                <svg
                  viewBox="0 0 50 50"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: cellSize * 0.8,
                    height: cellSize * 0.8,
                    overflow: "visible",
                    zIndex: 2,
                  }}
                >
                  <circle
                    cx="25"
                    cy="25"
                    r={r}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};