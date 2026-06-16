import React from "react";

export default function LOLCLogo({ style = {}, scale = 1 }) {
  const width = 80 * scale;
  const height = 64 * scale;
  
  const boxWidth = 72 * scale;
  const boxHeight = 52 * scale;
  
  const offset = 8 * scale;
  
  const fontSize = 24 * scale;

  return (
    <div style={{ position: "relative", width, height, flexShrink: 0, ...style }}>
      {/* Background Red Square */}
      <div 
        style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: boxWidth, 
          height: boxHeight, 
          background: "#e8192c", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      ></div>
      
      {/* Foreground Blue Box */}
      <div 
        style={{ 
          position: "absolute", 
          top: offset, 
          left: offset, 
          width: boxWidth, 
          height: boxHeight, 
          background: "#2563a8", 
          color: "white", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          fontWeight: 900,
          fontFamily: "Georgia, 'Times New Roman', serif", // The LOLC font is a prominent bold serif
          fontSize,
          letterSpacing: 0.5,
          boxShadow: "2px 2px 5px rgba(0,0,0,0.15)"
        }}
      >
        <span style={{ transform: "scaleY(1.1)", marginTop: -2 }}>LOLC</span>
      </div>
    </div>
  );
}
