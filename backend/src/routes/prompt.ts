import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';
import { isDemoMode } from '../config/supabase';
import { cozeConfig } from '../supabase.config';

const router = express.Router();

// Coze API 配置
const COZE_CONFIG = {
  apiKey: cozeConfig.apiKey || process.env.COZE_API_KEY || '',
  baseUrl: cozeConfig.baseUrl || process.env.COZE_BASE_URL || 'https://api.coze.com/v1',
  workflowId: cozeConfig.workflowId || process.env.COZE_WORKFLOW_ID || '',
  botId: cozeConfig.botId || process.env.COZE_BOT_ID || '',
};

// POST /api/prompt/optimize - 优化提示词
router.post('/optimize', authenticateToken, async (req, res) => {
  try {
    const { prompt, history } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: '请提供提示词' });
    }

    // 演示模式
    if (isDemoMode()) {
      const demoResponses = [
        'Maintain the overall composition and layout, upgrade materials to premium quality, enhance lighting effects with warm tones, add cinematic atmosphere, 8K ultra-high definition, photorealistic rendering, emphasize texture and detail differentiation.',
        'Preserve original geometric structure and main elements, convert to professional architectural photography style, add dramatic lighting, blue hour atmosphere, high contrast, detailed materials rendering, 8K resolution.',
        'Keep the original layout and composition, upgrade to modern minimalist style, enhance natural lighting, add soft shadows, warm color temperature, clean lines, premium materials, hyper-realistic rendering.',
      ];
      const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      
      return res.json({
        success: true,
        optimized: randomResponse,
        isDemo: true,
      });
    }

    // 使用 Coze 工作流
    if (COZE_CONFIG.workflowId && COZE_CONFIG.apiKey) {
      try {
        const optimized = await callCozeWorkflow(prompt);
        return res.json({
          success: true,
          optimized,
          isDemo: false,
          provider: 'Coze Workflow',
        });
      } catch (cozeError: any) {
        console.error('Coze Workflow error:', cozeError.message);
        return res.status(500).json({ error: 'Coze 工作流调用失败: ' + cozeError.message });
      }
    }

    // 没有配置 Coze，返回演示结果
    const demoResponses = [
      'Maintain the overall composition and layout, upgrade materials to premium quality, enhance lighting effects with warm tones, add cinematic atmosphere, 8K ultra-high definition, photorealistic rendering.',
    ];
    return res.json({
      success: true,
      optimized: demoResponses[0],
      isDemo: true,
    });

  } catch (error: any) {
    console.error('Prompt optimization error:', error.message);
    res.status(500).json({ error: error.message || '优化失败，请稍后重试' });
  }
});

// 调用 Coze 工作流
async function callCozeWorkflow(prompt: string): Promise<string> {
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 使用工作流 API
  const response = await axios.post(
    `${COZE_CONFIG.baseUrl}/workflows/run`,
    {
      workflow_id: COZE_CONFIG.workflowId,
      parameters: {
        prompt: prompt,
      },
      conversation_id: conversationId,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_CONFIG.apiKey}`,
      },
      timeout: 60000,
    }
  );

  // Coze 工作流返回格式
  const workflowResult = response.data;
  
  if (workflowResult.code === 0 && workflowResult.data?.output) {
    return workflowResult.data.output;
  }
  
  // 如果是异步执行，轮询获取结果
  if (workflowResult.data?.execution_id) {
    const executionId = workflowResult.data.execution_id;
    let retries = 30;
    
    while (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await axios.get(
          `${COZE_CONFIG.baseUrl}/workflows/status`,
          {
            params: {
              execution_id: executionId,
            },
            headers: {
              'Authorization': `Bearer ${COZE_CONFIG.apiKey}`,
            },
            timeout: 10000,
          }
        );
        
        const status = statusResponse.data;
        if (status.data?.status === 'succeeded') {
          return status.data.output || '';
        } else if (status.data?.status === 'failed') {
          throw new Error(status.data?.error || '工作流执行失败');
        }
      } catch (e) {
        console.error('Check workflow status error:', e);
      }
      
      retries--;
    }
    
    throw new Error('Coze 工作流响应超时');
  }

  throw new Error('Coze 工作流返回格式错误');
}

// GET /api/prompt/check - 检查 Coze API 可用性
router.get('/check', async (req, res) => {
  const demoMode = isDemoMode();
  
  if (demoMode) {
    return res.json({
      available: true,
      isDemo: true,
      provider: '演示模式',
    });
  }

  // 检查 Coze
  if (!COZE_CONFIG.apiKey || !COZE_CONFIG.workflowId || 
      COZE_CONFIG.apiKey === 'your-coze-api-key') {
    return res.json({
      available: false,
      isDemo: true,
      reason: '请配置 Coze 工作流 ID 和 API Key',
      provider: '演示模式',
    });
  }

  try {
    // 简单测试 API 是否可用
    await axios.get(
      `${COZE_CONFIG.baseUrl}/workflows`,
      {
        headers: {
          'Authorization': `Bearer ${COZE_CONFIG.apiKey}`,
        },
        timeout: 10000,
      }
    );

    res.json({
      available: true,
      isDemo: false,
      provider: 'Coze Workflow',
    });
  } catch (error: any) {
    res.json({
      available: false,
      isDemo: false,
      reason: error.message,
    });
  }
});

export default router;
