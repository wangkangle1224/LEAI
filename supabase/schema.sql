-- LEAI Supabase Database Schema
-- 执行此脚本在 Supabase SQL Editor 中创建所需的表和策略

-- ============================================
-- 扩展 auth.users 的 profiles 表
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  phone text unique,
  nickname text default '用户',
  avatar_url text,
  balance integer default 100,
  invite_code text unique,
  invited_count integer default 0,
  total_reward integer default 0,
  is_vip boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 生成历史表
-- ============================================
create table if not exists public.generation_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text,
  prompt text,
  image_url text,
  model text,
  resolution text,
  status text default 'completed',
  tokens_used integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 充值记录表
-- ============================================
create table if not exists public.recharge_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount integer not null,
  payment_method text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- ============================================
-- 邀请码表（用于追踪邀请关系）
-- ============================================
create table if not exists public.invitations (
  id uuid default uuid_generate_v4() primary key,
  inviter_id uuid references auth.users not null,
  invitee_id uuid references auth.users,
  invite_code text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

-- ============================================
-- 启用 Row Level Security (RLS)
-- ============================================
alter table public.profiles enable row level security;
alter table public.generation_history enable row level security;
alter table public.recharge_records enable row level security;
alter table public.invitations enable row level security;

-- ============================================
-- Profiles 表策略
-- ============================================
-- 用户只能查看和修改自己的 profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 允许插入自己的 profile（由 trigger自动创建）
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- ============================================
-- Generation History 表策略
-- ============================================
-- 用户只能查看和操作自己的历史记录
drop policy if exists "Users can view own history" on public.generation_history;
create policy "Users can view own history" on public.generation_history
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own history" on public.generation_history;
create policy "Users can insert own history" on public.generation_history
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own history" on public.generation_history;
create policy "Users can delete own history" on public.generation_history
  for delete using (auth.uid() = user_id);

-- ============================================
-- Recharge Records 表策略
-- ============================================
drop policy if exists "Users can view own recharges" on public.recharge_records;
create policy "Users can view own recharges" on public.recharge_records
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own recharges" on public.recharge_records;
create policy "Users can insert own recharges" on public.recharge_records
  for insert with check (auth.uid() = user_id);

-- ============================================
-- 函数：创建新用户时自动创建 profile
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, avatar_url, balance, invite_code)
  values (
    new.id,
    '用户' || substring(new.id::text from 1 for 6),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id::text,
    100,  -- 新用户赠送100积分
    'LEA' || upper(substring(md5(new.id::text) from 1 for 6))
  );
  return new;
end;
$$ language plpgsql security definer;

-- 创建 trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 索引优化
-- ============================================
create index if not exists idx_generation_history_user_id on public.generation_history(user_id);
create index if not exists idx_generation_history_created_at on public.generation_history(created_at desc);
create index if not exists idx_recharge_records_user_id on public.recharge_records(user_id);

-- ============================================
-- 启用 PostgreSQL 扩展
-- ============================================
create extension if not exists "uuid-ossp";
