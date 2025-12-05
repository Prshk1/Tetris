import { GoogleGenAI, Type } from "@google/genai";
import { Theme } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateTheme = async (prompt: string): Promise<Theme | null> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a color theme for a Tetris game based on this concept: "${prompt}".
      The theme should be cohesive and visually appealing.
      Contrast is important for gameplay.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            background: { type: Type.STRING, description: "Main app background hex color" },
            gridBackground: { type: Type.STRING, description: "Game board background hex color" },
            gridLine: { type: Type.STRING, description: "Grid line hex color" },
            text: { type: Type.STRING, description: "Primary text hex color" },
            tetrominoColors: {
              type: Type.OBJECT,
              properties: {
                I: { type: Type.STRING, description: "Hex color for I piece" },
                J: { type: Type.STRING, description: "Hex color for J piece" },
                L: { type: Type.STRING, description: "Hex color for L piece" },
                O: { type: Type.STRING, description: "Hex color for O piece" },
                S: { type: Type.STRING, description: "Hex color for S piece" },
                T: { type: Type.STRING, description: "Hex color for T piece" },
                Z: { type: Type.STRING, description: "Hex color for Z piece" },
              },
              required: ["I", "J", "L", "O", "S", "T", "Z"],
            },
          },
          required: ["name", "background", "gridBackground", "gridLine", "text", "tetrominoColors"],
        },
      },
    });

    if (response.text) {
        const theme = JSON.parse(response.text) as Theme;
        // Add the empty cell color which isn't generated
        theme.tetrominoColors['0'] = '#00000000';
        return theme;
    }
    return null;

  } catch (error) {
    console.error("Failed to generate theme:", error);
    return null;
  }
};