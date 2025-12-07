import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

export const generateNotificationDraft = async (
  reason: string,
  affectedArea: string,
  estimatedTime: string
): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key not found. Returning template string.");
    return `Alert: Network outage in ${affectedArea} due to ${reason}. Estimated resolution: ${estimatedTime}.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // We want a professional ISP notification message.
    const prompt = `
      You are a professional Network Operations Center (NOC) assistant for DishHome Fiber Net.
      Draft a concise, professional notification message for customers regarding a network outage.
      
      Details:
      - Reason: ${reason}
      - Area: ${affectedArea}
      - Estimated Resolution Time: ${estimatedTime}
      
      Keep it under 50 words. Use a polite and reassuring tone.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Alert: Network outage in ${affectedArea} due to ${reason}. Estimated resolution: ${estimatedTime}.`;
  }
};
