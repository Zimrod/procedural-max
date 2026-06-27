// src/remotion/SubtitlePage.tsx
import React from "react";
import type { TikTokPage } from "@remotion/captions";

export const SubtitlePage: React.FC<{
  page: TikTokPage;
  captionWidth: number;
}> = ({ page, captionWidth }) => {
  return (
    <div
      style={{
        width: captionWidth,
        margin: "0 auto",
        position: "absolute",
        bottom: 150,
        textAlign: "center",
        fontSize: 50,
        color: "white",
        fontWeight: "bold",
        textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
      }}
    >
      {page.lines?.map((line, i) => (
        <div key={i}>
          {line.tokens?.map((token, j) => (
            <span key={j}>{token.text} </span>
          ))}
        </div>
      ))}
    </div>
  );
};
