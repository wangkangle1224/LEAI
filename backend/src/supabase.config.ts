/**
 * Supabase Configuration
 * Copy this file to supabase.config.ts and fill in your credentials
 */

export const supabaseConfig = {
  // Supabase Project: zspejqxpjsfmhrddgylr
  url: 'https://zspejqxpjsfmhrddgylr.supabase.co',
  anonKey: 'sb_publishable_nGkCH7kP_R8npxVDDZ1rHw_ekeY0fpO',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcGVqcXhwanNmbWhyZGRneWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDczNzE2NywiZXhwIjoyMDg2MzEzMTY3fQ.2xDgA4k81M57EN5we0_Hu8LOEJd9UoiPyVxZ_IWB5O4' // Get this from Supabase Dashboard > Settings > API
};

export const jwtConfig = {
  secret: 'leai-jwt-secret-key-2026'
};

export const bananaConfig = {
  apiKey: 'sk-u6UD1x5HtFankIGczraMG0T8HFlyQGm3fHtIOZsp825f9Gbh',
  apiUrl: 'https://api.vectorengine.ai'
};

export const cozeConfig = {
  // Coze API 配置
  apiKey: 'your-coze-api-key', // 替换为您的 Coze API Key
  baseUrl: 'https://api.coze.com/v1',
  workflowId: 'your-workflow-id', // 替换为您的提示词优化工作流 ID
  botId: 'your-bot-id' // 如果使用 Bot 而不是工作流
};

export const deepseekConfig = {
  // DeepSeek API 配置
  apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx', // 替换为您的 DeepSeek API Key
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat'
};
