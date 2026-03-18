/**
 * In-Memory Storage for Demo Mode
 * 当没有配置 Supabase 时使用此存储
 */

import { v4 as uuidv4 } from 'uuid';

// User interface
export interface DemoUser {
  id: string;
  phone?: string;
  password?: string;
  nickname: string;
  avatar_url: string;
  balance: number;
  invite_code: string;
  invited_count: number;
  total_reward: number;
  is_vip: boolean;
  created_at: string;
}

// History interface
export interface DemoHistory {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  image_url: string;
  model: string;
  resolution: string;
  status: string;
  tokens_used: number;
  created_at: string;
}

// Recharge record interface
export interface DemoRecharge {
  id: string;
  user_id: string;
  amount: number;
  payment_method?: string;
  status: string;
  created_at: string;
}

// In-memory storage
class DemoStorage {
  private users: Map<string, DemoUser> = new Map();
  private usersByPhone: Map<string, string> = new Map(); // phone -> userId
  private history: Map<string, DemoHistory> = new Map();
  private recharges: Map<string, DemoRecharge> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize with a demo user
    this.initializeDemoUser();
    // Cleanup expired verification codes every hour
    this.refreshInterval = setInterval(() => {
      console.log('[Demo Storage] Running periodic cleanup...');
    }, 60 * 60 * 1000);
  }

  private initializeDemoUser() {
    const demoUser: DemoUser = {
      id: 'demo-user-001',
      phone: '13800138000',
      nickname: '建筑爱好者',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LEAI_User',
      balance: 1000,
      invite_code: 'LEAIDEMO',
      invited_count: 5,
      total_reward: 500,
      is_vip: true,
      created_at: new Date().toISOString()
    };
    this.users.set(demoUser.id, demoUser);
    this.usersByPhone.set(demoUser.phone!, demoUser.id);

    // 添加测试用户 wkl
    const testUser: DemoUser = {
      id: 'test-user-wkl',
      phone: '13900000000',
      password: '123456',
      nickname: 'wkl',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wkl',
      balance: 1000,
      invite_code: 'WKL12345',
      invited_count: 0,
      total_reward: 0,
      is_vip: true,
      created_at: new Date().toISOString()
    };
    this.users.set(testUser.id, testUser);
    this.usersByPhone.set(testUser.phone!, testUser.id);

    // 添加管理账号 15152542030
    const adminUser: DemoUser = {
      id: 'admin-user-15152542030',
      phone: '15152542030',
      nickname: '管理员',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      balance: 10000,
      invite_code: 'ADMIN001',
      invited_count: 0,
      total_reward: 0,
      is_vip: true,
      created_at: new Date().toISOString()
    };
    this.users.set(adminUser.id, adminUser);
    this.usersByPhone.set(adminUser.phone!, adminUser.id);
  }

  // User methods
  async createUser(phone: string, password: string, nickname: string): Promise<DemoUser | null> {
    if (this.usersByPhone.has(phone)) {
      return null; // Phone already registered
    }

    const user: DemoUser = {
      id: uuidv4(),
      phone,
      password, // In production, this should be hashed
      nickname,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
      balance: 100, // New user bonus
      invite_code: `LEA${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      invited_count: 0,
      total_reward: 0,
      is_vip: false,
      created_at: new Date().toISOString()
    };

    this.users.set(user.id, user);
    this.usersByPhone.set(phone, user.id);

    return user;
  }

  async getUserByPhone(phone: string): Promise<DemoUser | null> {
    const userId = this.usersByPhone.get(phone);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async getUserById(id: string): Promise<DemoUser | null> {
    return this.users.get(id) || null;
  }

  async getUserByUsername(username: string): Promise<DemoUser | null> {
    // 遍历所有用户，查找nickname匹配的用户
    for (const user of this.users.values()) {
      if (user.nickname === username) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<DemoUser>): Promise<DemoUser | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);

    return updatedUser;
  }

  // History methods
  async addHistory(userId: string, item: Omit<DemoHistory, 'id' | 'user_id' | 'created_at'>): Promise<DemoHistory | null> {
    const history: DemoHistory = {
      ...item,
      id: uuidv4(),
      user_id: userId,
      created_at: new Date().toISOString()
    };

    this.history.set(history.id, history);
    return history;
  }

  async getHistoryByUser(userId: string): Promise<DemoHistory[]> {
    const userHistory: DemoHistory[] = [];
    for (const item of this.history.values()) {
      if (item.user_id === userId) {
        userHistory.push(item);
      }
    }
    return userHistory.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async deleteHistory(id: string, userId: string): Promise<boolean> {
    const item = this.history.get(id);
    if (!item || item.user_id !== userId) {
      return false;
    }
    return this.history.delete(id);
  }

  // Recharge methods
  async addRecharge(userId: string, amount: number, paymentMethod?: string): Promise<DemoRecharge | null> {
    const recharge: DemoRecharge = {
      id: uuidv4(),
      user_id: userId,
      amount,
      payment_method: paymentMethod,
      status: 'completed', // Demo mode: always completed
      created_at: new Date().toISOString()
    };

    this.recharges.set(recharge.id, recharge);
    return recharge;
  }

  async getRechargesByUser(userId: string): Promise<DemoRecharge[]> {
    const userRecharges: DemoRecharge[] = [];
    for (const item of this.recharges.values()) {
      if (item.user_id === userId) {
        userRecharges.push(item);
      }
    }
    return userRecharges.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Cleanup
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Export singleton instance
export const demoStorage = new DemoStorage();

// Export class for testing
export { DemoStorage };
