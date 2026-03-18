/**
 * User Routes
 * 处理用户信息、余额等查询和更新
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
// GET /api/user/profile - 获取用户信息
// ============================================
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        error: { message: '未授权' }
      });
      return;
    }

    if (await isDemoUser(userId)) {
      const user = await demoStorage.getUserById(userId);
      if (!user) {
        res.status(404).json({
          error: { message: '用户不存在' }
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar_url,
          balance: user.balance,
          isVip: user.is_vip,
          inviteCode: user.invite_code,
          invitedCount: user.invited_count,
          totalReward: user.total_reward
        }
      });
    } else {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        res.status(404).json({
          error: { message: '用户不存在' }
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: profile.id,
          phone: profile.phone,
          nickname: profile.nickname,
          avatar: profile.avatar_url,
          balance: profile.balance,
          isVip: profile.is_vip,
          inviteCode: profile.invite_code,
          invitedCount: profile.invited_count,
          totalReward: profile.total_reward
        }
      });
    }
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: { message: '获取用户信息失败' }
    });
  }
});

// ============================================
// GET /api/user/balance - 获取用户余额
// ============================================
router.get('/balance', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        error: { message: '未授权' }
      });
      return;
    }

    if (await isDemoUser(userId)) {
      const user = await demoStorage.getUserById(userId);
      if (!user) {
        res.status(404).json({
          error: { message: '用户不存在' }
        });
        return;
      }

      res.json({
        success: true,
        balance: user.balance,
        isVip: user.is_vip
      });
    } else {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('balance, is_vip')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        res.status(404).json({
          error: { message: '用户不存在' }
        });
        return;
      }

      res.json({
        success: true,
        balance: profile.balance,
        isVip: profile.is_vip
      });
    }
  } catch (error: any) {
    console.error('Get balance error:', error);
    res.status(500).json({
      error: { message: '获取余额失败' }
    });
  }
});

// ============================================
// PUT /api/user/profile - 更新用户信息
// ============================================
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { nickname, avatar } = req.body;

    if (!userId) {
      res.status(401).json({
        error: { message: '未授权' }
      });
      return;
    }

    const updates: { nickname?: string; avatar_url?: string } = {};
    if (nickname) updates.nickname = nickname;
    if (avatar) updates.avatar_url = avatar;

    if (await isDemoUser(userId)) {
      const user = await demoStorage.updateUser(userId, updates);
      if (!user) {
        res.status(404).json({
          error: { message: '用户不存在' }
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar_url,
          balance: user.balance,
          isVip: user.is_vip,
          inviteCode: user.invite_code
        }
      });
    } else {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        res.status(400).json({
          error: { message: error.message }
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: profile.id,
          phone: profile.phone,
          nickname: profile.nickname,
          avatar: profile.avatar_url,
          balance: profile.balance,
          isVip: profile.is_vip,
          inviteCode: profile.invite_code
        }
      });
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: { message: '更新用户信息失败' }
    });
  }
});

// ============================================
// GET /api/user/invite-stats - 获取邀请统计
// ============================================
router.get('/invite-stats', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        error: { message: '未授权' }
      });
      return;
    }

    if (await isDemoUser(userId)) {
      const user = await demoStorage.getUserById(userId);
      if (!user) {
        res.status(404).json({
          error: { message: '用户不存在' }
        });
        return;
      }

      res.json({
        success: true,
        invitedCount: user.invited_count,
        totalReward: user.total_reward
      });
    } else {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('invited_count, total_reward')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        res.status(404).json({
          error: { message: '用户不存在' }
        });
        return;
      }

      res.json({
        success: true,
        invitedCount: profile.invited_count,
        totalReward: profile.total_reward
      });
    }
  } catch (error: any) {
    console.error('Get invite stats error:', error);
    res.status(500).json({
      error: { message: '获取邀请统计失败' }
    });
  }
});

export default router;
