/**
 * Authentication Routes
 * 处理用户注册、登录、验证码等功能
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { isDemoMode, supabase, supabaseAdmin, UserProfile } from '../config/supabase';
import { demoStorage, DemoUser } from '../services/demoStorage';
import { sendVerificationCode, verifyCode } from '../services/sms';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Request interfaces
interface RegisterRequest {
  phone: string;
  code: string;
  password: string;
  nickname?: string;
}

interface LoginRequest {
  phone: string;
  code: string;
}

interface VerifyCodeRequest {
  phone: string;
}

// ============================================
// POST /api/auth/send-code - 发送验证码
// ============================================
router.post('/send-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body as VerifyCodeRequest;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      res.status(400).json({
        error: { message: '请输入正确的手机号' }
      });
      return;
    }

    const result = await sendVerificationCode(phone);

    if (!result.success) {
      res.status(400).json({
        error: { message: result.message }
      });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      // Demo mode: return the code for testing
      ...(isDemoMode() && { demoCode: '123456' })
    });
  } catch (error: any) {
    console.error('Send code error:', error);
    res.status(500).json({
      error: { message: '发送验证码失败' }
    });
  }
});

// ============================================
// POST /api/auth/register - 用户注册
// ============================================
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code, password, nickname } = req.body as RegisterRequest;

    // Validate input
    if (!phone || !code || !password) {
      res.status(400).json({
        error: { message: '请填写完整信息' }
      });
      return;
    }

    // Validate phone format
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      res.status(400).json({
        error: { message: '请输入正确的手机号' }
      });
      return;
    }

    // Validate password
    if (password.length < 6) {
      res.status(400).json({
        error: { message: '密码长度至少6位' }
      });
      return;
    }

    // Verify code
    const codeResult = await verifyCode(phone, code);
    if (!codeResult.success) {
      res.status(400).json({
        error: { message: codeResult.message }
      });
      return;
    }

    if (isDemoMode()) {
      // Demo mode: use in-memory storage
      const existingUser = await demoStorage.getUserByPhone(phone);
      if (existingUser) {
        res.status(400).json({
          error: { message: '该手机号已注册' }
        });
        return;
      }

      const newUser = await demoStorage.createUser(
        phone,
        password,
        nickname || `用户${phone.slice(-4)}`
      );

      if (!newUser) {
        res.status(500).json({
          error: { message: '注册失败' }
        });
        return;
      }

      // Generate token
      const token = generateToken({ id: newUser.id, phone: newUser.phone });

      res.json({
        success: true,
        token,
        user: {
          id: newUser.id,
          phone: newUser.phone,
          nickname: newUser.nickname,
          avatar: newUser.avatar_url,
          balance: newUser.balance,
          isVip: newUser.is_vip,
          inviteCode: newUser.invite_code
        }
      });
    } else {
      // Real mode: use Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        phone,
        password
      });

      if (authError) {
        res.status(400).json({
          error: { message: authError.message }
        });
        return;
      }

      if (!authData.user) {
        res.status(500).json({
          error: { message: '注册失败' }
        });
        return;
      }

      // Update profile with nickname
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone,
          nickname: nickname || `用户${phone.slice(-4)}`
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Generate custom token
      const token = generateToken({ id: authData.user.id, phone });

      // Get full profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      res.json({
        success: true,
        token,
        user: profile ? {
          id: profile.id,
          phone: profile.phone,
          nickname: profile.nickname,
          avatar: profile.avatar_url,
          balance: profile.balance,
          isVip: profile.is_vip,
          inviteCode: profile.invite_code
        } : null
      });
    }
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      error: { message: '注册失败' }
    });
  }
});

// ============================================
// POST /api/auth/login - 用户登录
// ============================================
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body as LoginRequest;

    // Validate input
    if (!phone || !code) {
      res.status(400).json({
        error: { message: '请填写完整信息' }
      });
      return;
    }

    // Validate phone format
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      res.status(400).json({
        error: { message: '请输入正确的手机号' }
      });
      return;
    }

    // 演示模式：直接验证验证码是否为123456
    if (isDemoMode()) {
      if (code !== '123456') {
        res.status(400).json({
          error: { message: '验证码错误，演示模式验证码为123456' }
        });
        return;
      }
    } else {
      // Verify code
      const codeResult = await verifyCode(phone, code);
      if (!codeResult.success) {
        res.status(400).json({
          error: { message: codeResult.message }
        });
        return;
      }
    }

    // Demo mode: use in-memory storage
    const user = await demoStorage.getUserByPhone(phone);

    if (!user) {
      // Auto-register for demo
      const newUser = await demoStorage.createUser(
        phone,
        'demo123',
        `用户${phone.slice(-4)}`
      );

      if (!newUser) {
        res.status(500).json({
          error: { message: '登录失败' }
        });
        return;
      }

      const token = generateToken({ id: newUser.id, phone: newUser.phone });

      res.json({
        success: true,
        token,
        user: {
          id: newUser.id,
          phone: newUser.phone,
          nickname: newUser.nickname,
          avatar: newUser.avatar_url,
          balance: newUser.balance,
          isVip: newUser.is_vip,
          inviteCode: newUser.invite_code,
          invitedCount: newUser.invited_count,
          totalReward: newUser.total_reward
        }
      });
      return;
    }

    // Generate token
    const token = generateToken({ id: user.id, phone: user.phone });

    res.json({
      success: true,
      token,
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
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: '登录失败' }
    });
  }
});

// ============================================
// POST /api/auth/demo-login - 演示登录（快速测试）
// ============================================
router.post('/demo-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const demoUser = await demoStorage.getUserById('demo-user-001');

    if (!demoUser) {
      res.status(500).json({
        error: { message: '演示用户不存在' }
      });
      return;
    }

    const token = generateToken({ id: demoUser.id, phone: demoUser.phone });
    console.log('[Demo Login] Token generated successfully');
    console.log('[Demo Login] User ID:', demoUser.id);

    res.json({
      success: true,
      token,
      user: {
        id: demoUser.id,
        phone: demoUser.phone,
        nickname: demoUser.nickname,
        avatar: demoUser.avatar_url,
        balance: demoUser.balance,
        isVip: demoUser.is_vip,
        inviteCode: demoUser.invite_code,
        invitedCount: demoUser.invited_count,
        totalReward: demoUser.total_reward
      }
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    res.status(500).json({
      error: { message: '演示登录失败' }
    });
  }
});

// ============================================
// POST /api/auth/login-by-account - 账号密码登录
// ============================================
router.post('/login-by-account', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as { username: string; password: string };

    // Validate input
    if (!username || !password) {
      res.status(400).json({
        error: { message: '请填写用户名和密码' }
      });
      return;
    }

    // 在demoStorage中查找用户
    const user = await demoStorage.getUserByUsername(username);

    if (!user) {
      res.status(401).json({
        error: { message: '用户不存在' }
      });
      return;
    }

    // 验证密码
    if (user.password !== password) {
      res.status(401).json({
        error: { message: '密码错误' }
      });
      return;
    }

    // 生成token
    const token = generateToken({ id: user.id, phone: user.phone });

    res.json({
      success: true,
      token,
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
  } catch (error: any) {
    console.error('Login by account error:', error);
    res.status(500).json({
      error: { message: '登录失败' }
    });
  }
});

export default router;
