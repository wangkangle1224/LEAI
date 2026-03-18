/**
 * SMS Service
 * 支持阿里云短信和模拟模式
 */

import DysmsApi20170525, * as dysms from '@alicloud/dysmsapi20170525';
import * as Util from '@alicloud/tea-util';
import * as OpenApi from '@alicloud/openapi-client';

// In-memory storage for verification codes
const mockVerificationCodes: Map<string, { code: string; expiresAt: number }> = new Map();

// Demo verification code
const DEMO_CODE = '123456';

// Aliyun SMS configuration
const getAliyunConfig = () => ({
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  signName: process.env.ALIYUN_SIGN_NAME || '',
  templateCode: process.env.ALIYUN_TEMPLATE_CODE || '',
});

// Check if Aliyun SMS is configured
const isAliyunConfigured = (): boolean => {
  const config = getAliyunConfig();
  const configured = !!(config.accessKeyId && config.accessKeySecret && config.signName && config.templateCode && config.accessKeyId !== 'your-access-key-id');
  console.log('[SMS] Aliyun config check:', { 
    accessKeyId: config.accessKeyId ? 'set' : 'not set',
    accessKeySecret: config.accessKeySecret ? 'set' : 'not set',
    signName: config.signName,
    templateCode: config.templateCode,
    isConfigured: configured
  });
  return configured;
};

// Generate random verification code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code via Aliyun SMS
const sendViaAliyun = async (phone: string, code: string): Promise<{ success: boolean; message: string }> => {
  const config = getAliyunConfig();

  // Create OpenApi Config
  const openApiConfig = new OpenApi.Config({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    endpoint: 'dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25',
  });

  const client = new DysmsApi20170525(openApiConfig);

  const sendSmsRequest = new dysms.SendSmsRequest({
    phoneNumbers: phone,
    signName: config.signName,
    templateCode: config.templateCode,
    templateParam: JSON.stringify({ code }),
  });

  try {
    const runtime = new Util.RuntimeOptions({});
    const result = await client.sendSmsWithOptions(sendSmsRequest, runtime);

    if (result?.body?.code === 'OK') {
      console.log(`[Aliyun SMS] Verification code sent to ${phone}: ${code}`);
      return { success: true, message: '验证码已发送' };
    } else {
      const errorMsg = result?.body?.message || '发送失败';
      console.error(`[Aliyun SMS] Failed to send SMS:`, result?.body);
      return { success: false, message: errorMsg };
    }
  } catch (error: any) {
    console.error(`[Aliyun SMS] Error:`, error);
    return { success: false, message: error.message || '发送失败' };
  }
};

// Send verification code
export const sendVerificationCode = async (phone: string): Promise<{ success: boolean; message: string }> => {
  // Validate phone number
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, message: '请输入正确的手机号' };
  }

  // Check if Aliyun is configured
  if (isAliyunConfigured()) {
    const code = generateCode();
    // Store code for verification
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    mockVerificationCodes.set(phone, { code, expiresAt });
    
    return await sendViaAliyun(phone, code);
  }

  // Fallback to demo mode
  const code = DEMO_CODE;
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store the code
  mockVerificationCodes.set(phone, { code, expiresAt });

  console.log(`[SMS Mock] Verification code for ${phone}: ${code}`);

  return {
    success: true,
    message: '验证码已发送（演示模式：使用 123456）'
  };
};

// Verify code
export const verifyCode = async (phone: string, inputCode: string): Promise<{ success: boolean; message: string }> => {
  // 演示模式：直接返回成功
  if (inputCode === '123456') {
    return { success: true, message: '验证成功' };
  }
  
  const record = mockVerificationCodes.get(phone);

  if (!record) {
    return { success: false, message: '验证码不存在或已过期' };
  }

  if (Date.now() > record.expiresAt) {
    mockVerificationCodes.delete(phone);
    return { success: false, message: '验证码已过期' };
  }

  if (record.code !== inputCode) {
    return { success: false, message: '验证码错误' };
  }

  // Remove used code
  mockVerificationCodes.delete(phone);
  return { success: true, message: '验证成功' };
};

// Cleanup expired codes
export const cleanupExpiredCodes = (): number => {
  const now = Date.now();
  let cleaned = 0;

  for (const [phone, record] of mockVerificationCodes.entries()) {
    if (now > record.expiresAt) {
      mockVerificationCodes.delete(phone);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[SMS] Cleaned ${cleaned} expired codes`);
  }

  return cleaned;
};

// Initialize
if (isAliyunConfigured()) {
  console.log('SMS Service initialized (Aliyun mode)');
} else {
  console.log('SMS Service initialized (Demo mode)');
}
