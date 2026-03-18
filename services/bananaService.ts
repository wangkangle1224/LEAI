/**
 * Banana AI API Service
 * 基于 https://api.vectorengine.ai 的 Nano Banana 模型
 */

const API_KEY = process.env.VITE_BANANA_API_KEY || '';
const API_URL = process.env.VITE_BANANA_API_URL || 'https://api.vectorengine.ai';

interface BananaOptions {
  model?: string;  // 模型名称
  resolution?: string;  // 分辨率: '1K', '2K', '4K'
}

interface BananaResponse {
  id: string;
  status: string;
  output?: string;  // Base64 编码的图片
  error?: string;
}

/**
 * 调用 Banana AI API 生成建筑效果图
 */
export const generateArchitecturalImage = async (
  prompt: string,
  base64Image: string,
  options?: BananaOptions
): Promise<string> => {
  // 检查 API 密钥
  if (!API_KEY) {
    throw new Error('API 密钥未配置，请在 .env.local 文件中设置 VITE_BANANA_API_KEY');
  }

  try {
    // 清理 base64 前缀
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // 确定模型
    const modelName = options?.model || 'nano-banana';
    
    console.log(`🚀 开始调用 Banana API...`);
    console.log(`📡 API URL: ${API_URL}`);
    console.log(`🤖 模型: ${modelName}`);
    console.log(`📐 分辨率: ${options?.resolution || '1K'}`);

    // 构建请求体
    const requestBody = {
      model: {
        id: modelName,
        settings: {
          max_tokens: 2048,
          temperature: 0.7
        }
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${cleanBase64}`
              }
            }
          ]
        }
      ],
      stream: false
    };

    // 发送 API 请求
    const response = await fetch(`${API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Banana API 错误:', errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data: BananaResponse = await response.json();

    // 检查响应
    if (data.error) {
      throw new Error(`API 错误: ${data.error}`);
    }

    if (data.output) {
      console.log('✅ 图片生成成功!');
      return `data:image/png;base64,${data.output}`;
    }

    throw new Error('未能生成图片，API 返回为空');

  } catch (error: any) {
    console.error('❌ Banana API 错误:', error);

    // 提供更详细的错误信息
    if (error.message?.includes('API_KEY') || error.message?.includes('401') || error.message?.includes('unauthorized')) {
      throw new Error('API 密钥无效，请检查 VITE_BANANA_API_KEY 配置');
    } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      throw new Error('API 调用频率超限，请稍后再试');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络设置');
    } else {
      throw new Error(`生成失败: ${error.message || '未知错误'}`);
    }
  }
};

/**
 * 检查 API 是否可用
 */
export const checkBananaAPI = async (): Promise<{ available: boolean; message: string }> => {
  if (!API_KEY) {
    return { 
      available: false, 
      message: 'API 密钥未配置' 
    };
  }

  try {
    const response = await fetch(`${API_URL}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        available: true, 
        message: `API 连接成功，可用模型: ${data.data?.map((m: any) => m.id).join(', ') || 'nano-banana'}` 
      };
    } else {
      return { 
        available: false, 
        message: `API 连接失败: ${response.status} ${response.statusText}` 
      };
    }
  } catch (error: any) {
    return { 
      available: false, 
      message: `无法连接到 API: ${error.message}` 
    };
  }
};
