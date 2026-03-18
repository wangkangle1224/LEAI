<div align="center">
<img width="1200" height="475" alt="LEAI 建筑大师" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LEAI 建筑大师 - AI 建筑效果图生成平台

专为建筑生打造的极速智能渲染平台，内置海量专业提示词，告别繁琐调参，让效率翻倍。

## 功能特性

- **极速生成**: 采用 Google Gemini 2.5 Flash Image (Nano Banana) 模型，快速生成建筑效果图
- **高清输出**: 支持 1K / 2K / 4K 分辨率输出
- **多线路选择**: 
  - 线路一: Nano Banana Pro (快速模式)
  - 线路二: Gemini Pro Vision (高清模式)
- **专业提示词库**: 内置 50+ 建筑专业提示词
  - 建筑专题 (夜景、正午、黄昏、材质替换等)
  - 室内专题 (现代简约、新中式、北欧风)
  - 景观专题 (公园景观、庭院设计)
  - 分析图专题 (流线分析、功能分区)
  - 展板设计专题
- **提示词大师**: 大白话转专业话术，AI 智能优化
- **AI 对话改图**: 支持生成后继续对话调整细节
- **微信登录**: 扫码登录，便捷使用
- **金币充值**: 多种充值套餐可选

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/wangkangle1224/LEAI.git
   cd LEAI
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置 API 密钥**

   复制环境变量模板并配置：
   ```bash
   cp env.example .env.local
   ```

   然后编辑 `.env.local`，添加你的 Google Gemini API 密钥：
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   **获取 API 密钥**: 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**

   打开浏览器访问 http://localhost:3000

## 项目结构

```
leai-architecture-ai/
├── src/
│   ├── components/          # React 组件
│   │   ├── ChatInterface.tsx      # AI 对话改图界面
│   │   ├── Navbar.tsx            # 导航栏组件
│   │   ├── PromptLibrary.tsx     # 提示词库
│   │   ├── PromptMaster.tsx       # 提示词大师
│   │   └── CustomSelect.tsx       # 自定义选择组件
│   ├── services/
│   │   ├── geminiService.ts       # Gemini API 服务
│   │   └── mockAuthService.ts     # Mock 认证服务
│   ├── constants.ts              # 常量配置
│   ├── types.ts                  # TypeScript 类型
│   ├── App.tsx                  # 主应用组件
│   └── main.tsx                 # 入口文件
├── env.example                  # 环境变量模板
├── package.json
└── vite.config.ts              # Vite 配置
```

## 技术栈

- **前端框架**: React 19
- **语言**: TypeScript 5.8
- **构建工具**: Vite 6.2
- **AI 服务**: Google GenAI SDK 1.39
- **样式**: Tailwind CSS
- **UI 组件**: Material Icons

## 使用说明

1. **上传图片**: 点击上传框选择你的建筑草图或总平面图
2. **输入提示词**: 描述你想要的效果，或使用提示词库中的预设
3. **选择模型**: 
   - Nano Banana Pro: 快速生成，适合初稿
   - Gemini Pro Vision: 高清输出，适合最终效果
4. **选择分辨率**: 1K / 2K / 4K
5. **点击生成**: 等待 AI 完成渲染
6. **对话改图**: 生成后可以继续与 AI 对话调整细节

## 提示词库分类

| 分类 | 说明 |
|------|------|
| 建筑专题 | 夜景、正午、黄昏、材质替换、鸟瞰等 |
| 室内打光 | 自然光、暖色调、冷色调 |
| 室内专题 | 现代简约、新中式、北欧风 |
| 景观专题 | 公园景观、庭院设计 |
| 分析图专题 | 流线分析、功能分区 |
| 展板设计 | 极简排版等 |
| 平面鸟瞰转化 | 卫星图转鸟瞰等 |

## 常见问题

### Q: API 密钥无效怎么办？
A: 请确保你的 API 密钥有效且未过期。访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取新密钥。

### Q: 生成失败怎么办？
A: 检查网络连接，确保 API 密钥配置正确，或稍后重试。

### Q: 支持批量生成吗？
A: 目前支持单张图片生成，批量功能开发中。

## 后续规划

- [ ] 真实微信登录对接
- [ ] 支付系统集成
- [ ] 用户历史记录云端同步
- [ ] 批量生成功能
- [ ] 更多 AI 模型支持
- [ ] 移动端适配

## 许可证

MIT License

## 联系方式

- 邮箱: contact@leai.com
- 微信: LEAI_Official

---

Made with ❤️ for Architecture Students
