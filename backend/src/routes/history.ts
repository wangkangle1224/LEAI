/**
 * History Routes
 * 处理生成历史记录的查询和删除
 */

import { Router, Request, Response } from 'express';
import { isDemoMode, supabase } from '../config/supabase';
import { demoStorage } from '../services/demoStorage';
import { authenticateToken, AuthRequest } from '../middleware/auth';

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

// ============================================
// GET /api/history - 获取用户的历史记录
// ============================================
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: { message: '未授权' }
      });
      return;
    }

    if (await isDemoUser(userId)) {
      const history = await demoStorage.getHistoryByUser(userId);

      res.json({
        success: true,
        history: history.map(item => ({
          id: item.id,
          title: item.title,
          image: item.image_url,
          prompt: item.prompt,
          type: 'render',
          createdAt: item.created_at,
          status: item.status
        }))
      });
    } else {
      const { data, error } = await supabase
        .from('generation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({
          error: { message: '获取历史记录失败' }
        });
        return;
      }

      res.json({
        success: true,
        history: data.map(item => ({
          id: item.id,
          title: item.title,
          image: item.image_url,
          prompt: item.prompt,
          type: 'render',
          createdAt: item.created_at,
          status: item.status
        }))
      });
    }
  } catch (error: any) {
    console.error('Get history error:', error);
    res.status(500).json({
      error: { message: '获取历史记录失败' }
    });
  }
});

// ============================================
// DELETE /api/history/:id - 删除指定的历史记录
// ============================================
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        error: { message: '未授权' }
      });
      return;
    }

    if (await isDemoUser(userId)) {
      const success = await demoStorage.deleteHistory(id, userId);

      if (!success) {
        res.status(404).json({
          error: { message: '记录不存在或无权删除' }
        });
        return;
      }

      res.json({
        success: true,
        message: '删除成功'
      });
    } else {
      // First, check if the record belongs to the user
      const { data: record, error: fetchError } = await supabase
        .from('generation_history')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !record) {
        res.status(404).json({
          error: { message: '记录不存在或无权删除' }
        });
        return;
      }

      // Delete the record
      const { error: deleteError } = await supabase
        .from('generation_history')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) {
        res.status(500).json({
          error: { message: '删除失败' }
        });
        return;
      }

      res.json({
        success: true,
        message: '删除成功'
      });
    }
  } catch (error: any) {
    console.error('Delete history error:', error);
    res.status(500).json({
      error: { message: '删除历史记录失败' }
    });
  }
});

// ============================================
// DELETE /api/history - 清空所有历史记录
// ============================================
router.delete('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: { message: '未授权' }
      });
      return;
    }

    if (await isDemoUser(userId)) {
      // Get all user history and delete each one
      const history = await demoStorage.getHistoryByUser(userId);
      for (const item of history) {
        await demoStorage.deleteHistory(item.id, userId);
      }

      res.json({
        success: true,
        message: '已清空所有历史记录'
      });
    } else {
      const { error } = await supabase
        .from('generation_history')
        .delete()
        .eq('user_id', userId);

      if (error) {
        res.status(500).json({
          error: { message: '清空失败' }
        });
        return;
      }

      res.json({
        success: true,
        message: '已清空所有历史记录'
      });
    }
  } catch (error: any) {
    console.error('Clear history error:', error);
    res.status(500).json({
      error: { message: '清空历史记录失败' }
    });
  }
});

export default router;
