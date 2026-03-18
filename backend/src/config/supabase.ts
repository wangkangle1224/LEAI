/**
 * Supabase Client Configuration
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { supabaseConfig } from '../supabase.config';

// Use config file first, fallback to environment variables
const SUPABASE_URL = supabaseConfig.url || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = supabaseConfig.anonKey || process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = supabaseConfig.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Demo mode flag - set to true when no real Supabase credentials
// Can be forced via environment variable
const DEMO_MODE = process.env.FORCE_DEMO_MODE === 'true' || 
  !SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('your-project');

// Create Supabase clients
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Service role client (for admin operations, bypasses RLS)
export const supabaseAdmin: SupabaseClient = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : supabase;

// Demo mode check
export const isDemoMode = (): boolean => {
  return DEMO_MODE;
};

// Types
export interface UserProfile {
  id: string;
  phone?: string;
  nickname: string;
  avatar_url?: string;
  balance: number;
  invite_code?: string;
  invited_count: number;
  total_reward: number;
  is_vip: boolean;
  created_at?: string;
}

export interface GenerationHistory {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  image_url: string;
  model: string;
  resolution: string;
  status: string;
  tokens_used: number;
  created_at?: string;
}

export interface RechargeRecord {
  id: string;
  user_id: string;
  amount: number;
  payment_method?: string;
  status: string;
  created_at?: string;
}

// Helper function to get user by ID
export async function getUserById(userId: string): Promise<UserProfile | null> {
  if (DEMO_MODE) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data as UserProfile;
}

// Helper function to update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  if (DEMO_MODE) {
    return { ...updates, id: userId } as UserProfile;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return data as UserProfile;
}

// Log configuration status
console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                  Supabase Configuration                      ║
╠════════════════════════════════════════════════════════════════════╣
║  URL: ${SUPABASE_URL ? SUPABASE_URL.substring(0, 40) + '...' : 'NOT CONFIGURED'}
║  Key: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT CONFIGURED'}
║  Mode: ${DEMO_MODE ? 'DEMO (in-memory)' : 'REAL (Supabase)'}
╚════════════════════════════════════════════════════════════════════╝
`);
