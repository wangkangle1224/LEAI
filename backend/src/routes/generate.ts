/**
 * Generate Routes
 * 代理 Banana API 调用，处理图片生成
 */

import { Router, Request, Response } from 'express';
import { isDemoMode, supabase } from '../config/supabase';
import { demoStorage } from '../services/demoStorage';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { bananaConfig } from '../supabase.config';

const router = Router();

// Helper function to check if user is a demo user
// 优先检查 demoStorage 中是否存在该用户
const isDemoUser = async (userId: string): Promise<boolean> => {
  // demo- 开头的 ID 是演示用户
  if (userId.startsWith('demo-')) return true;
  // 检查是否在 demoStorage 中存在
  const demoUser = await demoStorage.getUserById(userId);
  if (demoUser) return true;
  // 演示模式：所有用户都使用 demoStorage
  if (isDemoMode()) return true;
  // 非演示模式
  return false;
};

// Banana API 配置
const BANANA_API_KEY = bananaConfig.apiKey || process.env.BANANA_API_KEY || '';
const BANANA_API_URL = bananaConfig.apiUrl || process.env.BANANA_API_URL || 'https://api.vectorengine.ai';

// 积分消耗配置
const TOKEN_COSTS: Record<string, number> = {
  '1K': 10,
  '2K': 20,
  '4K': 50
};

// Generate request interface
interface GenerateRequest {
  prompt: string;
  image: string; // base64 encoded
  model?: string;
  resolution?: string;
  aspectRatio?: string;
}

// ============================================
// POST /api/generate - 生成图片
// ============================================
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { prompt, image, model = 'nano-banana', resolution = '1K', aspectRatio } = req.body as GenerateRequest;

    if (!userId) {
      res.status(401).json({
        error: { message: '未授权' }
      });
      return;
    }

    if (!prompt || !image) {
      res.status(400).json({
        error: { message: '缺少必要参数' }
      });
      return;
    }

    // 获取用户信息
    let user;
    if (await isDemoUser(userId)) {
      user = await demoStorage.getUserById(userId);
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      user = profile;
    }

    if (!user) {
      res.status(404).json({
        error: { message: '用户不存在' }
      });
      return;
    }

    // 检查积分是否足够
    const cost = TOKEN_COSTS[resolution] || TOKEN_COSTS['1K'];
    if (user.balance < cost) {
      res.status(402).json({
        error: { message: '积分不足，请先充值', balance: user.balance, required: cost }
      });
      return;
    }

    // 清理 base64 前缀
    const cleanBase64 = image.split(',')[1] || image;

    // 构建最终提示词
    const finalPrompt = aspectRatio ? `${prompt} ${aspectRatio}` : prompt;

    console.log(`\uD83D\uDD37 Generating image for user ${userId}`);
    console.log(`\uD83E\uDE78 Model: ${model}, Resolution: ${resolution}, Cost: ${cost} tokens`);
    console.log(`   Image provided: ${!!image}, length: ${image?.length || 0}`);

    let generatedImage: string;

    // 判断是否是基于输入图片生成（image-to-image）还是纯文本生成
    const hasImageInput = cleanBase64 && cleanBase64.length > 100;

    try {
      let apiUrl: string;
      let requestBody: any;

      // 根据模型选择合适的 API
      if (model.startsWith('dall-e')) {
        // DALL-E 模型使用专门的图片生成 API
        apiUrl = `${BANANA_API_URL}/v1/images/generations`;
        requestBody = {
          model: model,
          prompt: finalPrompt,
          n: 1,
          size: resolution === '4K' ? '1024x1024' : resolution === '2K' ? '1024x1024' : '1024x1024',
          quality: 'standard'
        };
      } else if (model.startsWith('veo')) {
        // Google Veo 视频/图片生成 API
        apiUrl = `${BANANA_API_URL}/v1beta/videoGeneration`;
        requestBody = {
          model: model,
          prompt: finalPrompt,
          image: hasImageInput ? `data:image/jpeg;base64,${cleanBase64}` : undefined
        };
      } else if (model.startsWith('gpt-image')) {
        // GPT Image 模型
        apiUrl = `${BANANA_API_URL}/v1/chat/completions`;
        requestBody = {
          model: model,
          messages: [
            {
              role: 'user',
              content: hasImageInput ? [
                { type: 'text', text: finalPrompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
              ] : finalPrompt
            }
          ],
          max_tokens: 2048
        };
      } else if (model.startsWith('gemini')) {
        // Gemini 模型 (支持图片输入)
        apiUrl = `${BANANA_API_URL}/v1/chat/completions`;
        requestBody = {
          model: model,
          messages: [
            {
              role: 'user',
              content: hasImageInput ? [
                { type: 'text', text: finalPrompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
              ] : finalPrompt
            }
          ],
          max_tokens: 4096
        };
      } else {
        // 默认使用 GPT 兼容格式
        apiUrl = `${BANANA_API_URL}/v1/chat/completions`;
        requestBody = {
          model: model,
          messages: [
            {
              role: 'user',
              content: hasImageInput ? [
                { type: 'text', text: finalPrompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
              ] : finalPrompt
            }
          ],
          max_tokens: 2048
        };
      }

      console.log(`Calling API: ${apiUrl}`);
      console.log(`Request:`, JSON.stringify(requestBody).substring(0, 200));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BANANA_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Banana API Error:', errorText);
        res.status(500).json({
          error: { message: `API 请求失败: ${response.status} ${response.statusText}`, details: errorText }
        });
        return;
      }

      const responseData = await response.json() as any;
      console.log(`Response:`, JSON.stringify(responseData).substring(0, 500));

      // 解析不同模型的响应
      if (model.startsWith('dall-e')) {
        // DALL-E 响应格式 - 返回 URL
        const imageUrl = responseData.data?.[0]?.url;
        if (imageUrl) {
          // 下载图片并转换为 base64
          try {
            const imageResponse = await fetch(imageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64 = Buffer.from(imageBuffer).toString('base64');
            generatedImage = `data:image/png;base64,${base64}`;
          } catch {
            // 如果下载失败，直接返回 URL
            generatedImage = imageUrl;
          }
        } else {
          throw new Error('DALL-E 未返回图片');
        }
      } else if (model.startsWith('nano-banana')) {
        // Nano Banana 响应格式 - 可能返回 base64 图片
        if (responseData.output) {
          // 直接返回 base64 图片
          generatedImage = `data:image/png;base64,${responseData.output}`;
        } else if (responseData.choices?.[0]?.message?.content) {
          const content = responseData.choices[0].message.content;
          // 尝试提取 base64 图片
          if (content.includes('base64')) {
            const match = content.match(/base64,([A-Za-z0-9+/=]+)/);
            if (match) {
              generatedImage = `data:image/png;base64,${match[1]}`;
            } else {
              throw new Error('无法从响应中提取图片');
            }
          } else if (content.startsWith('data:image') || content.match(/^[A-Za-z0-9+/=]+$/)) {
            // 直接是 base64 或 data URL
            generatedImage = content.startsWith('data:') ? content : `data:image/png;base64,${content}`;
          } else {
            // 返回文本描述
            throw new Error('nano-banana 返回了文本而非图片');
          }
        } else {
          throw new Error('未知的响应格式');
        }
      } else if (responseData.output) {
        // 某些模型的输出格式
        generatedImage = `data:image/png;base64,${responseData.output}`;
      } else if (responseData.choices?.[0]?.message?.content) {
        // 文本模型返回的是分析结果，不是图片
        // 尝试从 content 中提取 base64 图片
        const content = responseData.choices[0].message.content;
        if (content.includes('base64')) {
          const match = content.match(/base64,([A-Za-z0-9+/=]+)/);
          if (match) {
            generatedImage = `data:image/png;base64,${match[1]}`;
          } else {
            throw new Error('模型返回了文本而非图片');
          }
        } else {
          throw new Error('当前模型不支持图片生成');
        }
      } else {
        throw new Error('未知的响应格式');
      }
    } catch (apiError: any) {
      console.error('API Error:', apiError);
      res.status(500).json({
        error: { message: `生成失败: ${apiError.message}` }
      });
      return;
    }

    // 扣除积分
    const newBalance = user.balance - cost;
    if (await isDemoUser(userId)) {
      await demoStorage.updateUser(userId, { balance: newBalance });
    } else {
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);
    }

    // 保存到历史记录
    const historyItem = {
      user_id: userId,
      title: `建筑渲染_${new Date().getDate()}日`,
      prompt: finalPrompt,
      image_url: generatedImage,
      model,
      resolution,
      status: 'completed',
      tokens_used: cost
    };

    if (await isDemoUser(userId)) {
      await demoStorage.addHistory(userId, historyItem);
    } else {
      await supabase
        .from('generation_history')
        .insert(historyItem);
    }

    console.log(`\u2705 Image generated successfully for user ${userId}`);

    res.json({
      success: true,
      image: generatedImage,
      balance: newBalance,
      cost
    });

  } catch (error: any) {
    console.error('Generate error:', error);
    res.status(500).json({
      error: { message: `生成失败: ${error.message || '未知错误'}` }
    });
  }
});

// ============================================
// GET /api/generate/check - 检查 API 是否可用
// ============================================
router.get('/check', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!BANANA_API_KEY) {
      res.json({
        available: false,
        message: 'Banana API 密钥未配置'
      });
      return;
    }

    const response = await fetch(`${BANANA_API_URL}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${BANANA_API_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json() as { data?: { id: string }[] };
      res.json({
        available: true,
        message: `API 连接成功，可用模型: ${data.data?.map((m) => m.id).join(', ') || 'nano-banana'}`
      });
    } else {
      res.json({
        available: false,
        message: `API 连接失败: ${response.status} ${response.statusText}`
      });
    }
  } catch (error: any) {
    res.json({
      available: false,
      message: `无法连接到 API: ${error.message}`
    });
  }
});

export default router;
