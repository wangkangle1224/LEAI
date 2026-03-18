/**
 * Frontend API Service
 * 调用后端 API 接口
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 获取存储的 token
const getToken = (): string | null => {
  return localStorage.getItem('leai_token');
};

// 设置 token
const setToken = (token: string): void => {
  localStorage.setItem('leai_token', token);
};

// 移除 token
const removeToken = (): void => {
  localStorage.removeItem('leai_token');
};

// API 响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
  [key: string]: any;
}

// 通用请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  console.log('[API Request]', endpoint);
  console.log('[API] Token from localStorage:', token ? `${token.substring(0, 30)}...` : 'none');
  console.log('[API] Token length:', token ? token.length : 0);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  console.log('[API] Final headers:', JSON.stringify(headers));

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    
    if (!text) {
      return {
        success: false,
        error: {
          message: '服务器响应为空',
        },
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', text);
      return {
        success: false,
        error: {
          message: '服务器响应格式错误',
        },
      };
    }

    if (!response.ok) {
      const errorMessage = data.error?.message || data.message || data.msg || `请求失败: ${response.status}`;
      console.error('[API Error] Response not ok:', response.status, data);
      return {
        success: false,
        error: {
          message: errorMessage,
        },
      };
    }

    return { success: true, ...data };
  } catch (error: any) {
    console.error('API Request Error:', error);
    return {
      success: false,
      error: {
        message: error.message || '网络请求失败',
      },
    };
  }
}

// ============================================
// 认证接口
// ============================================

// 发送验证码
export const sendVerificationCode = async (
  phone: string
): Promise<ApiResponse<{ demoCode?: string }>> => {
  return apiRequest<{ demoCode?: string }>('/api/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
};

// 用户注册
export const register = async (
  phone: string,
  code: string,
  password: string,
  nickname?: string
): Promise<ApiResponse<{ token: string; user: User }>> => {
  return apiRequest<{ token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, code, password, nickname }),
  });
};

// 用户登录
export const login = async (
  phone: string,
  code: string
): Promise<ApiResponse<{ token: string; user: User }>> => {
  return apiRequest<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
};

// 演示登录
export const demoLogin = async (): Promise<ApiResponse<{ token: string; user: User }>> => {
  return apiRequest<{ token: string; user: User }>('/api/auth/demo-login', {
    method: 'POST',
  });
};

// 账号密码登录
export const loginByAccount = async (username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
  return apiRequest<{ token: string; user: User }>('/api/auth/login-by-account', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

// ============================================
// 用户接口
// ============================================

// 获取用户信息
export const getUserProfile = async (): Promise<ApiResponse<{ user: User }>> => {
  return apiRequest<{ user: User }>('/api/user/profile');
};

// 获取用户余额
export const getUserBalance = async (): Promise<ApiResponse<{ balance: number; isVip: boolean }>> => {
  return apiRequest<{ balance: number; isVip: boolean }>('/api/user/balance');
};

// 更新用户信息
export const updateUserProfile = async (
  updates: { nickname?: string; avatar?: string }
): Promise<ApiResponse<{ user: User }>> => {
  return apiRequest<{ user: User }>('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// 获取邀请统计
export const getInviteStats = async (): Promise<
  ApiResponse<{ invitedCount: number; totalReward: number }>
> => {
  return apiRequest<{ invitedCount: number; totalReward: number }>('/api/user/invite-stats');
};

// ============================================
// 生成接口
// ============================================

// 检查 API 是否可用
export const checkBananaAPI = async (): Promise<
  ApiResponse<{ available: boolean; message: string }>
> => {
  return apiRequest<{ available: boolean; message: string }>('/api/generate/check');
};

// 生成图片
export const generateImage = async (params: {
  prompt: string;
  image: string;
  model?: string;
  resolution?: string;
  aspectRatio?: string;
}): Promise<ApiResponse<{ image: string; balance: number; cost: number }>> => {
  return apiRequest<{ image: string; balance: number; cost: number }>('/api/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
};

// ============================================
// 历史记录接口
// ============================================

// 获取历史记录
export const getHistory = async (): Promise<
  ApiResponse<{ history: HistoryItem[] }>
> => {
  return apiRequest<{ history: HistoryItem[] }>('/api/history');
};

// 删除历史记录
export const deleteHistory = async (
  id: string
): Promise<ApiResponse<{}>> => {
  return apiRequest<{}>(`/api/history/${id}`, {
    method: 'DELETE',
  });
};

// 清空历史记录
export const clearHistory = async (): Promise<ApiResponse<{}>> => {
  return apiRequest<{}>('/api/history', {
    method: 'DELETE',
  });
};

// ============================================
// 充值接口
// ============================================

// 获取充值套餐
export const getRechargePackages = async (): Promise<
  ApiResponse<{ packages: RechargePackage[] }>
> => {
  return apiRequest<{ packages: RechargePackage[] }>('/api/recharge/packages');
};

// 创建充值订单
export const createRecharge = async (
  packageId: number,
  paymentMethod?: string
): Promise<
  ApiResponse<{
    orderId: string;
    amount: number;
    bonus: number;
    total: number;
    newBalance: number;
    isVip: boolean;
    vipUpgraded: boolean;
  }>
> => {
  return apiRequest<{
    orderId: string;
    amount: number;
    bonus: number;
    total: number;
    newBalance: number;
    isVip: boolean;
    vipUpgraded: boolean;
  }>('/api/recharge', {
    method: 'POST',
    body: JSON.stringify({ packageId, paymentMethod }),
  });
};

// 获取充值历史
export const getRechargeHistory = async (): Promise<
  ApiResponse<{ history: RechargeHistory[] }>
> => {
  return apiRequest<{ history: RechargeHistory[] }>('/api/recharge/history');
};

// ============================================
// 提示词优化接口
// ============================================

// 检查提示词优化 API 可用性
export const checkPromptAPI = async (): Promise<
  ApiResponse<{ available: boolean; isDemo: boolean; provider: string }>
> => {
  return apiRequest<{ available: boolean; isDemo: boolean; provider: string }>('/api/prompt/check');
};

// 优化提示词
export const optimizePrompt = async (
  prompt: string,
  history?: { role: string; content: string }[]
): Promise<ApiResponse<{ optimized: string; isDemo: boolean; provider?: string }>> => {
  return apiRequest<{ optimized: string; isDemo: boolean; provider?: string }>('/api/prompt/optimize', {
    method: 'POST',
    body: JSON.stringify({ prompt, history }),
  });
};

// ============================================
// 提示词优化接口
// ============================================

// 检查 DeepSeek API 可用性
export const checkDeepSeekAPI = async (): Promise<
  ApiResponse<{ available: boolean; isDemo: boolean; provider?: string; reason?: string }>
> => {
  return apiRequest<{ available: boolean; isDemo: boolean; provider?: string; reason?: string }>('/api/prompt/check');
};

// ============================================
// 类型定义
// ============================================

export interface User {
  id: string;
  phone?: string;
  nickname: string;
  avatar: string;
  balance: number;
  inviteCode?: string;
  invitedCount?: number;
  totalReward?: number;
  isVip: boolean;
}

export interface HistoryItem {
  id: string;
  title: string;
  image: string;
  prompt: string;
  type: string;
  createdAt: string;
  status: string;
}

export interface RechargePackage {
  id: number;
  amount: number;
  price: number;
  bonus: number;
  total: number;
}

export interface RechargeHistory {
  id: string;
  amount: number;
  paymentMethod?: string;
  status: string;
  createdAt: string;
}

// ============================================
// 工具函数
// ============================================

export { getToken, setToken, removeToken };
