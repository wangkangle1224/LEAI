/**
 * LEAI Backend - Express Server Entry Point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import generateRoutes from './routes/generate';
import historyRoutes from './routes/history';
import rechargeRoutes from './routes/recharge';
import promptRoutes from './routes/prompt';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration - 支持开发和生产环境
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allowed?: boolean) => void) {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3002',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3002',
    ];
    
    // 生产环境域名（需要用户自行配置）
    const productionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    allowedOrigins.push(...productionOrigins);

    // 如果没有 origin（如同源请求），允许通过
    if (!origin) {
      return callback(null, true);
    }

    // 检查是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked request from: ${origin}`);
      callback(null, true); // 暂时允许所有，生产环境可以改为 false
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/prompt', promptRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not Found' } });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    LEAI Backend Server                      ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                   ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
╠════════════════════════════════════════════════════════════╣
║  API Endpoints:                                             ║
║  - POST /api/auth/register   注册                           ║
║  - POST /api/auth/login      登录                           ║
║  - POST /api/auth/verify-code 发送验证码                     ║
║  - GET  /api/user/profile    获取用户信息                   ║
║  - GET  /api/user/balance   获取余额                       ║
║  - POST /api/generate        生成图片                       ║
║  - GET  /api/history        获取历史                       ║
║  - DELETE /api/history/:id   删除历史                       ║
║  - POST /api/recharge        充值                          ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
