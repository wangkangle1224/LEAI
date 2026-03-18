/**
 * Mock Authentication Service
 * 模拟微信登录、充值、历史记录等功能
 */

// 用户类型定义
export interface User {
  id: string;
  nickname: string;
  avatar: string;
  balance: number;
  inviteCode: string;
  invitedCount: number;
  totalReward: number;
  isVip?: boolean;  // VIP 状态
}

export interface HistoryItem {
  id: string;
  title: string;
  image: string;
  prompt: string;
  type: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
}

// 模拟用户数据
let mockUser: User = {
  id: 'user_001',
  nickname: '建筑爱好者',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LEAI_User',
  balance: 1000,
  inviteCode: 'LEA888',
  invitedCount: 5,
  totalReward: 500,
  isVip: true  // 默认 VIP 用户，方便测试
};

// 模拟历史记录
let mockHistory: HistoryItem[] = [
  {
    id: 'hist_001',
    title: '现代极简别墅渲染',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBG_lDBPgT9UZiEI4Wl9d0cML5cSSZOJ3yNRw5lbzMzE2CoZTaUz1AZQS9aC4faHdrI6U3pqxeaTl-VA2Itzu9cL3Lz2kZgYzedm2MgWDiyj6kYPRB4iR6npQB4ARTnsocZfJr0KcwAVMGEYjX2DU84iAuJIXFVc25V7X7fpOkZly4z1QI97TQqeltYbhdrPrqA0c8JsCd1vToAlHztYhQ93iGKdKM8oq5CrhE6zPy8M2WyeOC7g-y--pcIAibqdOqLU1mztD_J2YA',
    prompt: '现代极简风格建筑渲染',
    type: 'render',
    createdAt: '2024-03-15 14:30',
    status: 'completed'
  },
  {
    id: 'hist_002',
    title: '中式庭院效果图',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6VC9qV2D0FapA7Wlnql1UjTBk4eiIDvTfChzM7XWSGnxEzfHc9WOSptqYV7QSc2a-kutlVJIFUrXkors0BUoICNz652RNmRBA26aGUBIgRz9pmQB4Qb5VJzWCDZqpWSwJ4XRh3GT_BohON-46ArZ3Jr7S07ov-fcC0N1mSt6UVyZWR1rvIPfUDQWKmFndu-YY4YQJ4tPyqw9ZWpfKulvStUTg9jZdD2pV34JwnExxq4hmtSmNG8XjWKYzrMnW_z1Eq1qQqGBebHQ',
    prompt: '新中式庭院设计',
    type: 'render',
    createdAt: '2024-03-14 10:20',
    status: 'completed'
  },
  {
    id: 'hist_003',
    title: '总平面图填色',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_bmLGKYWSO9WPl1h3qF4cVphodT7MILH2cWBbjiohUSZPVzJPplRY6zEDxCqbTNYCWaO9TzEQoDNp1tzAAtLVTT5yEa9fVUKej0Isew2es36zfQUVjZCyinFi4j9qFNJGg0NZNpRPDgygBevTRyebL1L_kvzO6nZgtxgVD075LFJfiNwwJxpSXQY5_ojHeysd6Yc7o1qTWKZm8GXd6Mmfo2mYOkEMLp-pw9wlkDy63B4P5azyG2yPRJBXfjCTNSyOSoSi2bneq3k',
    prompt: '专业总平面图填色',
    type: 'site_plan',
    createdAt: '2024-03-13 16:45',
    status: 'completed'
  }
];

// 模拟延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 模拟微信登录
 */
export const mockLogin = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
  await delay(1000); // 模拟网络延迟

  // 模拟登录成功
  return {
    success: true,
    user: { ...mockUser }
  };
};

/**
 * 模拟手机号注册
 */
export const mockRegister = async (phone: string, code: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  await delay(1500); // 模拟网络延迟

  // 验证手机号格式
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, error: '请输入正确的手机号' };
  }

  // 验证验证码 (模拟：123456)
  if (code !== '123456') {
    return { success: false, error: '验证码错误，请输入 123456' };
  }

  // 验证密码
  if (!password || password.length < 6) {
    return { success: false, error: '密码长度至少6位' };
  }

  // 模拟注册成功，返回新用户
  const newUser: User = {
    id: `user_${Date.now()}`,
    nickname: `用户${phone.slice(-4)}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
    balance: 100, // 新用户赠送100积分
    inviteCode: `LEA${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    invitedCount: 0,
    totalReward: 0,
    isVip: false
  };

  return {
    success: true,
    user: newUser
  };
};

/**
 * 模拟获取用户信息
 */
export const mockGetUserInfo = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
  await delay(500);
  
  return {
    success: true,
    user: { ...mockUser }
  };
};

/**
 * 模拟获取用户余额
 */
export const mockGetBalance = async (): Promise<{ success: boolean; balance?: number; error?: string }> => {
  await delay(300);
  
  return {
    success: true,
    balance: mockUser.balance
  };
};

/**
 * 模拟金币充值
 * @param amount 充值金币数量
 */
export const mockRecharge = async (amount: number): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  await delay(1500); // 模拟支付处理
  
  // 模拟不同充值金额
  if (amount === 100 || amount === 500 || amount === 2000) {
    mockUser.balance += amount;
    return {
      success: true,
      newBalance: mockUser.balance
    };
  }
  
  return {
    success: false,
    error: '无效的充值金额'
  };
};

/**
 * 模拟获取历史记录
 */
export const mockGetHistory = async (): Promise<{ success: boolean; history?: HistoryItem[]; error?: string }> => {
  await delay(800);
  
  return {
    success: true,
    history: [...mockHistory]
  };
};

/**
 * 模拟添加历史记录
 */
export const mockAddHistory = async (item: Omit<HistoryItem, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; item?: HistoryItem }> => {
  await delay(500);

  const newItem: HistoryItem = {
    ...item,
    id: `hist_${Date.now()}`,
    createdAt: new Date().toLocaleString('zh-CN'),
    status: 'completed'
  };

  mockHistory.unshift(newItem);

  return {
    success: true,
    item: newItem
  };
};

/**
 * 模拟删除历史记录
 */
export const mockDeleteHistory = async (id: string): Promise<{ success: boolean; error?: string }> => {
  await delay(300);

  const item = mockHistory.find(item => item.id === id);
  if (!item) {
    return { success: false, error: '记录不存在' };
  }

  // 使用 filter 创建新数组，避免引用问题
  mockHistory = mockHistory.filter(item => item.id !== id);
  return { success: true };
};

/**
 * 模拟获取邀请统计
 */
export const mockGetInviteStats = async (): Promise<{ 
  success: boolean; 
  invitedCount?: number; 
  totalReward?: number; 
  error?: string 
}> => {
  await delay(400);
  
  return {
    success: true,
    invitedCount: mockUser.invitedCount,
    totalReward: mockUser.totalReward
  };
};

/**
 * 模拟退出登录
 */
export const mockLogout = async (): Promise<{ success: boolean }> => {
  await delay(300);
  
  // 重置为初始状态
  mockUser = {
    ...mockUser,
    balance: 0,
    invitedCount: 0,
    totalReward: 0
  };
  
  return { success: true };
};
