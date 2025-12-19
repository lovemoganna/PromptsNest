import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000; // 2 seconds

// Helper function to sleep for a given duration
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Helper to check if error is a rate limit error
const isRateLimitError = (error: any): boolean => {
  const errorMessage = error?.message || String(error);
  return errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');
};

// Extract retry delay from error message if available
const extractRetryDelay = (error: any): number | null => {
  const errorMessage = error?.message || String(error);
  const match = errorMessage.match(/retry in (\d+(?:\.\d+)?)/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000); // Convert to ms
  }
  return null;
};

// Retry wrapper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (isRateLimitError(error)) {
        // Get delay from error or use exponential backoff
        const suggestedDelay = extractRetryDelay(error);
        const backoffDelay = INITIAL_DELAY_MS * Math.pow(2, attempt);
        const delay = suggestedDelay || backoffDelay;

        console.warn(`Rate limit hit for ${operationName}. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);

        if (attempt < MAX_RETRIES - 1) {
          await sleep(delay);
          continue;
        }
      }

      // Non-rate-limit error or max retries reached, throw immediately
      throw error;
    }
  }

  throw lastError;
}

// Centralized error handling
const handleApiError = (error: any, operation: string): string => {
  console.error(`Gemini ${operation} Error:`, error);

  const errorMessage = error?.message || String(error);

  if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
    return "API 额度已耗尽 (Rate Limit)。请稍后再试（通常需等待 1 分钟）或检查您的 API Key 配额。";
  }

  if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
    return "API 访问被拒绝。请确保您的 API Key 有权使用 gemini-3-flash-preview 模型。";
  }

  if (errorMessage.includes('401') || errorMessage.includes('API_KEY_INVALID')) {
    return "API Key 无效，请在 .env.local 中重新配置。";
  }

  return `Gemini 服务异常 (${operation}): ${errorMessage.slice(0, 50)}...`;
};

export const translateText = async (text: string, targetLang: 'en' | 'zh'): Promise<string> => {
  if (!apiKey) return "API Key missing. Please configure process.env.API_KEY.";

  try {
    const prompt = targetLang === 'en'
      ? `Translate the following AI prompt to English. Keep technical terms accurate for AI generation models (e.g., Midjourney, Stable Diffusion). Only return the translation:\n\n${text}`
      : `Translate the following AI prompt to Chinese. Ensure it flows naturally. Only return the translation:\n\n${text}`;

    const response = await withRetry(
      () => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      }),
      'Translation'
    );

    return response.text?.trim() || "Translation failed.";
  } catch (error) {
    return handleApiError(error, "Translation");
  }
};

export const polishPrompt = async (text: string): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  try {
    const prompt = `Act as an expert Prompt Engineer. Improve the following prompt for better clarity, detail, and artistic output. Do not change the core subject, but enhance descriptors and structure. Return only the improved prompt:\n\n${text}`;

    const response = await withRetry(
      () => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      }),
      'Polish'
    );

    return response.text?.trim() || "Polishing failed.";
  } catch (error) {
    return handleApiError(error, "Polish");
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
    const response = await withRetry(
      () => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
      }),
      'Magic Fill'
    );

    if (response.text) {
      return JSON.parse(response.text) as MagicFillResult;
    }
    return null;
  } catch (error) {
    const errText = handleApiError(error, "Magic Fill");
    // For magicFill, we return null to signify failure in UI, but the error is logged.
    // However, it might be better to throw or handle it in the component to show a specific message.
    throw new Error(errText);
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

    const response = await withRetry(
      () => ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Supports multimodal
        contents: { parts: [imagePart, textPart] }
      }),
      'Image-to-Prompt'
    );

    return response.text?.trim() || "Image analysis failed.";
  } catch (error) {
    return handleApiError(error, "Image-to-Prompt");
  }
};

export const runPromptTest = async (promptText: string, model: string = 'gemini-3-flash-preview'): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot run test.";
  try {
    const response = await withRetry(
      () => ai.models.generateContent({
        model: model,
        contents: promptText,
      }),
      'Test Run'
    );
    return response.text?.trim() || "No response generated.";
  } catch (error) {
    return handleApiError(error, "Test Run");
  }
};

export const generateVariations = async (promptText: string): Promise<string[]> => {
  if (!apiKey) return ["API Key missing."];
  try {
    const response = await withRetry(
      () => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
      }),
      'Variations'
    );

    if (response.text) {
      return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (error) {
    handleApiError(error, "Variations");
    return [];
  }
}

export interface TagSuggestion {
  techTags: string[];
  styleTags: string[];
}

export const suggestTags = async (promptText: string): Promise<TagSuggestion | null> => {
  if (!apiKey || !promptText) return null;

  try {
    const response = await withRetry(
      () => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following AI prompt and suggest relevant tags in Chinese.
        
        Prompt: "${promptText}"
        
        Requirements:
        1. Tech Tags: 2-4 technical keywords describing techniques (e.g., '高清', '4K渲染', '光影效果', '景深', '后期', '一致性', '运镜')
        2. Style Tags: 2-4 style keywords describing aesthetics (e.g., '赛博朋克', '极简主义', '复古', '油画风格', '动漫风', '写实')
        
        Return tags in Chinese. Focus on specific, useful tags that would help categorize this prompt.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              techTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              styleTags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['techTags', 'styleTags']
          }
        }
      }),
      'Tag Suggestion'
    );

    if (response.text) {
      return JSON.parse(response.text) as TagSuggestion;
    }
    return null;
  } catch (error) {
    handleApiError(error, "Tag Suggestion");
    return null;
  }
}