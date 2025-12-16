import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const translateText = async (text: string, targetLang: 'en' | 'zh'): Promise<string> => {
  if (!apiKey) return "API Key missing. Please configure process.env.API_KEY.";
  
  try {
    const prompt = targetLang === 'en' 
      ? `Translate the following AI prompt to English. Keep technical terms accurate for AI generation models (e.g., Midjourney, Stable Diffusion). Only return the translation:\n\n${text}`
      : `Translate the following AI prompt to Chinese. Ensure it flows naturally. Only return the translation:\n\n${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text?.trim() || "Translation failed.";
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return "Error calling Gemini API.";
  }
};

export const polishPrompt = async (text: string): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  try {
    const prompt = `Act as an expert Prompt Engineer. Improve the following prompt for better clarity, detail, and artistic output. Do not change the core subject, but enhance descriptors and structure. Return only the improved prompt:\n\n${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "Polishing failed.";
  } catch (error) {
    console.error("Gemini Polish Error:", error);
    return "Error calling Gemini API.";
  }
};

export interface MagicFillResult {
  title: string;
  outputType: string;
  sceneTag: string;
  techTags: string[];
  styleTags: string[];
  usageNote: string;
}

export const magicFillPrompt = async (promptText: string): Promise<MagicFillResult | null> => {
  if (!apiKey || !promptText) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following AI prompt and extract structured metadata for a knowledge base. Return all content in Chinese (Simplified).
      
      Prompt: "${promptText}"
      
      Requirements:
      1. Title: A short, descriptive title (3-6 words) in Chinese.
      2. Output Type: One of ['图像', '视频', '音频', '文本'].
      3. Scene Tag: One of ['角色设计', '场景生成', '风格转换', '故事创作', '工具使用', '其他'].
      4. Tech Tags: List 1-3 technical keywords (e.g., '一致性', '光效', '运镜') in Chinese.
      5. Style Tags: List 1-3 visual/artistic style keywords (e.g., '赛博朋克', '写实') in Chinese.
      6. Usage Note: A brief tip on how to best use this prompt (max 15 words) in Chinese.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            outputType: { type: Type.STRING, enum: ['图像', '视频', '音频', '文本'] },
            sceneTag: { type: Type.STRING, enum: ['角色设计', '场景生成', '风格转换', '故事创作', '工具使用', '其他'] },
            techTags: { type: Type.ARRAY, items: { type: Type.STRING } },
            styleTags: { type: Type.ARRAY, items: { type: Type.STRING } },
            usageNote: { type: Type.STRING }
          },
          required: ['title', 'outputType', 'sceneTag', 'techTags', 'styleTags', 'usageNote']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MagicFillResult;
    }
    return null;
  } catch (error) {
    console.error("Gemini Magic Fill Error:", error);
    return null;
  }
};

export const generatePromptFromImage = async (base64Image: string, mimeType: string = 'image/png'): Promise<string> => {
    if (!apiKey) return "API Key missing.";

    try {
        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Image
            }
        };
        const textPart = {
            text: "Analyze this image and generate a high-quality AI image generation prompt (in English) that would recreate this style and composition. Focus on lighting, subject, camera angle, and artistic style. Return ONLY the prompt text."
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Supports multimodal
            contents: { parts: [imagePart, textPart] }
        });

        return response.text?.trim() || "Image analysis failed.";
    } catch (error) {
        console.error("Gemini Image-to-Prompt Error:", error);
        return "Error analyzing image.";
    }
};

export const runPromptTest = async (promptText: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot run test.";
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: promptText,
    });
    return response.text?.trim() || "No response generated.";
  } catch (error) {
    console.error("Gemini Test Run Error:", error);
    return `Error: ${(error as Error).message}`;
  }
};

export const generateVariations = async (promptText: string): Promise<string[]> => {
  if (!apiKey) return ["API Key missing."];
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide 3 distinct variations of the following AI prompt. 
      1. One that is more descriptive and detailed.
      2. One that is more concise and minimal.
      3. One that focuses on artistic style and atmosphere.
      
      Return ONLY a JSON array of strings. No markdown, no explanations.
      
      Original Prompt: "${promptText}"`,
      config: {
         responseMimeType: "application/json",
         responseSchema: {
             type: Type.ARRAY,
             items: { type: Type.STRING }
         }
      }
    });
    
    if (response.text) {
        return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (error) {
      console.error("Gemini Variations Error:", error);
      return [];
  }
}