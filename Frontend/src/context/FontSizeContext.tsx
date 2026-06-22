"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

export type FontSize = "normal" | "large" | "xlarge";

type FontSizeContextType = {
  fontSize: FontSize;
  cycleFontSize: () => void;
  setFontSize: (size: FontSize) => void;
};

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const FontSizeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fontSize, setFontSizeState] = useState<FontSize>("normal");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only run on client side
    const savedSize = localStorage.getItem("fontSize") as FontSize | null;
    const initialSize = savedSize || "normal";
    setFontSizeState(initialSize);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("fontSize", fontSize);
      
      // Apply font-size to the html element
      if (fontSize === "large") {
        document.documentElement.style.fontSize = "18px";
      } else if (fontSize === "xlarge") {
        document.documentElement.style.fontSize = "20px";
      } else {
        // Normal/default font size (clear custom style to fallback to browser default)
        document.documentElement.style.fontSize = "";
      }
    }
  }, [fontSize, isInitialized]);

  const cycleFontSize = () => {
    setFontSizeState((prevSize) => {
      if (prevSize === "normal") return "large";
      if (prevSize === "large") return "xlarge";
      return "normal";
    });
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, cycleFontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error("useFontSize must be used within a FontSizeProvider");
  }
  return context;
};
