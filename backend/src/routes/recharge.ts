/**
 * Recharge Routes
 * 处理用户充值逻辑
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

// 充值配置
const RECHARGE_PACKAGES = [
  { id: 1, amount: 100, price: 9.9, bonus: 0 },
  { id: 2, amount: 500, price: 45, bonus: 50 },
  { id: 3, amount: 2000, price: 168, bonus: 200 }
];

// Recharge request interface
interface RechargeRequest {
  packageId: number;
  paymentMethod?: string;
}

// ============================================
// GET /api/recharge/packages - 获取充值套餐
// ============================================
router.get('/packages', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      packages: RECHARGE_PACKAGES.map(pkg => ({
        id: pkg.id,
        amount: pkg.amount,
        price: pkg.price,
        bonus: pkg.bonus,
        total: pkg.amount + pkg.bonus
      }))
    });
  } catch (error: any) {
    console.error('Get packages error:', error);
    res.status(500).json({
      error: { message: '获取充值套餐失败' }
    });
  }
});

// ============================================
// POST /api/recharge - 创建充值订单
// ============================================
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { packageId, paymentMethod = 'wechat' } = req.body as RechargeRequest;

    if (!userId) {
      res.status(401).json({
        error: { message: '未授权' }
      });
      return;
    }

    // 查找套餐
    const pkg = RECHARGE_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      res.status(400).json({
        error: { message: '无效的充值套餐' }
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

    // 在演示模式下，直接完成充值
    const newBalance = user.balance + pkg.amount + pkg.bonus;
    const orderId = `order_${Date.now()}`;
    
    // 检查是否需要升级VIP（充值满2000金币自动升级）
    const shouldUpgradeVip = (pkg.amount + pkg.bonus) >= 2000 || user.is_vip;
    const isVipNow = shouldUpgradeVip;

    if (await isDemoUser(userId)) {
      // 更新用户余额和VIP状态
      await demoStorage.updateUser(userId, { 
        balance: newBalance,
        is_vip: isVipNow
      });

      // 创建充值记录
      await demoStorage.addRecharge(userId, pkg.amount + pkg.bonus, paymentMethod);

      res.json({
        success: true,
        orderId,
        amount: pkg.amount,
        bonus: pkg.bonus,
        total: pkg.amount + pkg.bonus,
        newBalance,
        isVip: isVipNow,
        vipUpgraded: !user.is_vip && isVipNow
      });
    } else {
      // 真实模式下，需要创建订单并等待支付回调
      // 这里简化处理，直接更新余额和VIP状态
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          balance: newBalance,
          is_vip: isVipNow
        })
        .eq('id', userId);

      if (updateError) {
        res.status(500).json({
          error: { message: '充值失败' }
        });
        return;
      }

      // 创建充值记录
      const { error: recordError } = await supabase
        .from('recharge_records')
        .insert({
          user_id: userId,
          amount: pkg.amount + pkg.bonus,
          payment_method: paymentMethod,
          status: 'completed'
        });

      if (recordError) {
        console.error('Create recharge record error:', recordError);
      }

      res.json({
        success: true,
        orderId,
        amount: pkg.amount,
        bonus: pkg.bonus,
        total: pkg.amount + pkg.bonus,
        newBalance,
        isVip: isVipNow,
        vipUpgraded: !user.is_vip && isVipNow
      });
    }
  } catch (error: any) {
    console.error('Recharge error:', error);
    res.status(500).json({
      error: { message: '充值失败' }
    });
  }
});

// ============================================
// GET /api/recharge/history - 获取充值历史
// ============================================
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: { message: '未授权' }
      });
      return;
    }

    if (await isDemoUser(userId)) {
      const recharges = await demoStorage.getRechargesByUser(userId);

      res.json({
        success: true,
        history: recharges.map(item => ({
          id: item.id,
          amount: item.amount,
          paymentMethod: item.payment_method,
          status: item.status,
          createdAt: item.created_at
        }))
      });
    } else {
      const { data, error } = await supabase
        .from('recharge_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({
          error: { message: '获取充值历史失败' }
        });
        return;
      }

      res.json({
        success: true,
        history: data.map(item => ({
          id: item.id,
          amount: item.amount,
          paymentMethod: item.payment_method,
          status: item.status,
          createdAt: item.created_at
        }))
      });
    }
  } catch (error: any) {
    console.error('Get recharge history error:', error);
    res.status(500).json({
      error: { message: '获取充值历史失败' }
    });
  }
});

export default router;
