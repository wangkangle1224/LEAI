import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.VITE_GEMINI_API_KEY || '';

// 检查 API 密钥是否配置
if (!apiKey) {
  console.warn('⚠️ 警告: VITE_GEMINI_API_KEY 未配置，请创建 .env.local 文件并添加 API 密钥');
}

const ai = new GoogleGenAI({ apiKey });

interface GenerateOptions {
  model?: string;
  resolution?: string; // '1K', '2K', '4K'
}

/**
 * Generates an architectural image based on a prompt and an input image.
 * Uses Gemini 2.5 Flash Image (Nano Banana) by default, or upgrades to Pro for high res.
 */
export const generateArchitecturalImage = async (
  prompt: string,
  base64Image: string,
  options?: GenerateOptions
): Promise<string> => {
  // 检查 API 密钥
  if (!apiKey) {
    throw new Error('API 密钥未配置，请在 .env.local 文件中设置 VITE_GEMINI_API_KEY');
  }

  try {
    // Remove data:image/png;base64, prefix if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // Determine model based on resolution or user selection
    let modelName = options?.model || 'gemini-2.5-flash-image';
    
    // Upgrade to Pro model if resolution is 2K or 4K, as Flash Image doesn't support imageSize config
    if (options?.resolution === '2K' || options?.resolution === '4K') {
      modelName = 'gemini-3-pro-image-preview';
    }

    const config: any = {};
    
    // imageSize is only supported by gemini-3-pro-image-preview
    if (modelName === 'gemini-3-pro-image-preview' && options?.resolution) {
       config.imageConfig = {
         imageSize: options.resolution
       };
    }

    console.log(`🚀 开始生成图片... 模型: ${modelName}, 分辨率: ${options?.resolution || '1K'}`);

    const response = await ai.models.generateContent({
      model: modelName, 
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg/png input
              data: cleanBase64
            }
          }
        ]
      },
      config: config
    });

    // Check for image parts in the response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
            console.log('✅ 图片生成成功!');
            return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("API 返回中未找到生成的图片");
  } catch (error: any) {
    console.error("❌ Gemini API 错误:", error);
    
    // 提供更详细的错误信息
    if (error.message?.includes('API_KEY')) {
      throw new Error('API 密钥无效或已过期，请检查配置');
    } else if (error.message?.includes('quota')) {
      throw new Error('API 调用次数已达上限，请稍后再试');
    } else if (error.message?.includes('model not found')) {
      throw new Error('指定的模型不可用，请选择其他模型');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络设置');
    } else {
      throw new Error(`生成失败: ${error.message || '未知错误'}`);
    }
  }
};