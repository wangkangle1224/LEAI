import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomSelect } from './components/CustomSelect';
import { PromptMaster } from './components/PromptMaster';
import { PromptLibrary } from './components/PromptLibrary';
import { ChatInterface } from './components/ChatInterface';
import { 
  DEFAULT_PROMPT, 
  GALLERY_ITEMS, 
  PLACEHOLDER_INPUT_IMAGE,
  MODEL_OPTIONS,
  TEMPLATE_OPTIONS,
  RESOLUTION_OPTIONS,
  ASPECT_RATIO_OPTIONS
} from './constants';
import * as api from './services/api';
import { GenerationStatus, GalleryItem } from './types';
import type { User, HistoryItem } from './services/api';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'chat'>('home');

  // User State
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVip, setIsVip] = useState(false);  // VIP 状态

  // 应用启动时检查 token 并恢复登录状态
  useEffect(() => {
    console.log('[Auth] Checking token on app start...');
    const token = api.getToken();
    console.log('[Auth] Token found:', !!token, token ? token.substring(0, 20) + '...' : '');
    if (token) {
      // 验证 token 并获取用户信息
      api.getUserProfile().then(result => {
        console.log('[Auth] Profile result:', result);
        if (result.success && result.data?.user) {
          setUser(result.data.user);
          setIsLoggedIn(true);
          setIsVip(result.data.user.isVip || false);
          console.log('[Auth] Login restored successfully');
        } else {
          // token 无效，清除它
          console.log('[Auth] Token invalid, clearing...');
          api.removeToken();
        }
      }).catch(err => {
        console.error('[Auth] Error restoring login:', err);
        api.removeToken();
      });
    }
  }, []);

  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  
  // Selection State
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0]);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_OPTIONS[0]);
  const [selectedResolution, setSelectedResolution] = useState(RESOLUTION_OPTIONS[0]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(ASPECT_RATIO_OPTIONS[1]); // 默认 16:9
  const [templateCategory, setTemplateCategory] = useState<string>('arch'); // 当前模板分类

  // Chat State (passed to ChatInterface)
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [chatInputImage, setChatInputImage] = useState<string>('');
  const [chatGeneratedImage, setChatGeneratedImage] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<GenerationStatus>('idle');

  // History State
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipMessage, setVipMessage] = useState('');
  
  // Sidebar State
  const [isPromptMasterOpen, setIsPromptMasterOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 根据选择的模板分类获取对应的输入框提示词
  const getPlaceholder = () => {
    const placeholders: Record<string, string> = {
      'arch': "描述您想要的建筑效果，如：把这栋楼变成新中式风格，添加中式屋顶；将建筑转为夜景效果；生成建筑爆炸分析图等",
      'interior': "描述您想要的室内效果，如：把客厅改成北欧风格，添加原木家具；生成室内软装物料清单；做毛坯房改造等",
      'interior_light': "描述您想要的光照效果，如：让房间光线更明亮，添加暖色调灯光；只开射灯；设计黄昏时刻氛围等",
      'landscape': "描述您想要的景观效果，如：在庭院中添加水景和绿植；生成植物四季变化；做景观设计分析等",
      'analysis': "描述您想要的分析图类型，如：生成一张建筑流线分析图；风环境分析图；体块分析图等",
      'board': "描述您的展板设计需求，如：做一个建筑毕业设计展板；室内设计作品集展板等",
      'aerial': "描述您想要的鸟瞰图效果，如：将总平面图转化为写实鸟瞰图；生成彩色总平面图等",
    };
    return placeholders[templateCategory] || "描述您想要生成的画面...";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (index !== undefined) {
            // 更新指定索引的图片
            const newImages = [...inputImages];
            newImages[index] = event.target.result as string;
            setInputImages(newImages);
          } else {
            // 单张图片上传（兼容）
            setInputImages([event.target.result as string]);
          }
          setGeneratedImage(null); // Reset generated image on new upload
          setStatus('idle');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理多文件选择
  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const readers = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(images => {
        // 合并现有图片和新图片，最多保留3张
        const newImages = [...inputImages, ...images].slice(0, 3);
        setInputImages(newImages);
        setGeneratedImage(null);
        setStatus('idle');
      });
    }
  };

  // 触发文件上传（单张）
  const triggerFileUpload = (index?: number) => {
    if (index !== undefined) {
      fileInputRefs.current[index]?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  // 触发多文件上传
  const triggerMultiFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => {
      const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
      handleMultipleFileChange(event);
    };
    input.click();
  };

  // 删除指定索引的图片
  const removeImage = (index: number) => {
    const newImages = inputImages.filter((_, i) => i !== index);
    setInputImages(newImages);
    setGeneratedImage(null);
    setStatus('idle');
  };

  const handleGenerate = async () => {
    // 检查是否登录，未登录则先登录
    if (!isLoggedIn) {
      setPendingGenerate(true);
      setShowLoginModal(true);
      return;
    }

    // 已登录，直接执行生成（至少需要1张图片）
    if (inputImages.length > 0) {
      executeGenerate();
    }
  };

  // 聊天界面重新生成/修改图片
  const handleChatRegenerate = async (newPrompt: string) => {
    // 检查是否登录，未登录则先登录
    if (!isLoggedIn) {
      setPendingGenerate(true);
      setShowLoginModal(true);
      return;
    }

    // 已登录，直接执行
    if (chatInputImage) {
      executeChatRegenerate(newPrompt);
    }
  };

  // 实际执行聊天重新生成
  const executeChatRegenerate = async (newPrompt: string) => {
    setChatStatus('generating');
    setChatPrompt(newPrompt);
    
    try {
      let imageToSend = chatInputImage;
      if (imageToSend.startsWith('http')) {
         try {
             const response = await fetch(imageToSend);
             const blob = await response.blob();
             imageToSend = await new Promise((resolve) => {
                 const reader = new FileReader();
                 reader.onloadend = () => resolve(reader.result as string);
                 reader.readAsDataURL(blob);
             });
         } catch(e) {
             setChatStatus('error');
             return;
         }
      }

      // 调用后端 API 生成图片
      const result = await api.generateImage({
        prompt: newPrompt,
        image: imageToSend,
        model: selectedModel.id,
        resolution: selectedResolution.id,
        aspectRatio: selectedAspectRatio.id
      });

      // 处理两种可能的返回结构：嵌套(data.image)和平铺(image)
      const imageData = result.data?.image || result.image;
      const balanceData = result.data?.balance ?? result.balance;

      if (result.success && imageData) {
        setChatGeneratedImage(imageData);
        setChatStatus('success');

        // 更新余额显示
        if (balanceData !== undefined && user) {
          setUser({ ...user, balance: balanceData });
        }

        // 刷新历史记录
        const historyResult = await api.getHistory();
        if (historyResult.success && historyResult.data?.history) {
          setHistoryItems(historyResult.data.history);
        }
      } else {
        console.error('生成失败:', result.error?.message);
        setChatStatus('error');
      }
    } catch (error) {
      console.error(error);
      setChatStatus('error');
    }
  };

  // 处理分辨率选择（非 VIP 选择 4K 时提示）
  const handleResolutionChange = (option: any) => {
    if (!isLoggedIn) {
      setVipMessage('请先登录后再生成图片');
      setShowVipModal(true);
      return;
    }
    if (option.isVip && !isVip) {
      setVipMessage('4K 超清分辨率需要 VIP 会员资格');
      setShowVipModal(true);
      return;
    }
    setSelectedResolution(option);
  };

  // 处理宽高比选择
  const handleAspectRatioChange = (option: any) => {
    if (!isLoggedIn) {
      setVipMessage('请先登录后再生成图片');
      setShowVipModal(true);
      return;
    }
    if (option.isVip && !isVip) {
      setVipMessage('该比例需要 VIP 会员资格');
      setShowVipModal(true);
      return;
    }
    setSelectedAspectRatio(option);
  };

  const handleGalleryClick = (item: GalleryItem) => {
    setPrompt(item.prompt);
    setInputImage(item.image);
    setGeneratedImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setStatus('idle');
    setGeneratedImage(null);
    setChatStatus('idle');
    setChatGeneratedImage(null);
  };

  // 下载图片
  const handleDownload = (imageUrl: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `leai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 处理历史记录点击（加载到首页）
  // 点击历史记录，跳转到聊天界面查看
  const handleHistoryItemClick = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setInputImage(item.image);
    setGeneratedImage(item.image);
    setChatPrompt(item.prompt);
    setChatInputImage(item.image);
    setChatGeneratedImage(item.image);
    setChatStatus('success');
    // 切换到聊天界面查看
    setCurrentView('chat');
  };

  // 处理历史记录删除 - 使用后端 API
  const handleHistoryDelete = async (id: string) => {
    // 调用后端 API 删除
    const result = await api.deleteHistory(id);
    if (result.success) {
      // 删除成功后更新本地状态
      setHistoryItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // 登录处理 - 使用后端 API 登录
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await api.demoLogin();
      if (result.success && result.token && result.user) {
        // 保存 token
        api.setToken(result.token);
        setUser(result.user);
        setIsVip(result.user.isVip || false);
        setIsLoggedIn(true);

        // 如果登录前有生成请求，登录后自动执行
        if (pendingGenerate) {
          setPendingGenerate(false);
          // 延迟执行，确保状态已更新
          setTimeout(() => {
            if (inputImages.length > 0) {
              executeGenerate();
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 账号密码登录处理
  const handleAccountLogin = async () => {
    if (!loginUsername || !loginPassword) {
      setLoginError('请输入用户名和密码');
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    try {
      const result = await api.loginByAccount(loginUsername, loginPassword);
      if (result.success && result.token && result.user) {
        // 保存 token
        api.setToken(result.token);
        setUser(result.user);
        setIsVip(result.user.isVip || false);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        
        // 清空登录表单
        setLoginUsername('');
        setLoginPassword('');

        // 如果登录前有生成请求，登录后自动执行
        if (pendingGenerate) {
          setPendingGenerate(false);
          setTimeout(() => {
            if (inputImages.length > 0) {
              executeGenerate();
            }
          }, 100);
        }
      } else {
        setLoginError(result.error?.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setLoginError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!loginPhone || !/^1[3-9]\d{9}$/.test(loginPhone)) {
      setLoginError('请输入正确的手机号');
      return;
    }
    
    setIsSendingCode(true);
    setLoginError('');
    
    // 模拟发送验证码
    setTimeout(() => {
      setCodeCountdown(60);
      const timer = setInterval(() => {
        setCodeCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setIsSendingCode(false);
    }, 500);
  };

  // 手机号验证码登录（前端模拟）
  const handlePhoneLogin = async () => {
    if (!loginPhone || !loginCode) {
      setLoginError('请输入手机号和验证码');
      return;
    }
    
    // 演示模式：验证码必须为123456
    if (loginCode !== '123456') {
      setLoginError('验证码错误，请输入123456');
      return;
    }
    
    // 验证码正确，调用后端 API 登录
    setIsLoading(true);
    setLoginError('');

    try {
      const result = await api.login(loginPhone, loginCode);
      
      if (result.success && result.token && result.user) {
        api.setToken(result.token);
        setUser(result.user);
        setIsVip(result.user.isVip || false);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        
        setLoginPhone('');
        setLoginCode('');
        
        if (pendingGenerate) {
          setPendingGenerate(false);
          setTimeout(() => {
            if (inputImages.length > 0) {
              executeGenerate();
            }
          }, 100);
        }
      } else {
        setLoginError(result.error?.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setLoginError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 实际执行生成（抽取出来方便复用）
  const executeGenerate = async () => {
    // 添加调试日志
    const token = api.getToken();
    console.log('[Generate] Token:', !!token, token ? token.substring(0, 30) + '...' : '');
    console.log('[Generate] isLoggedIn:', isLoggedIn);
    console.log('[Generate] user:', user);

    setChatPrompt(prompt);
    setChatInputImage(inputImages[0] || '');
    setChatGeneratedImage(null);
    setCurrentView('chat');
    setStatus('generating');
    setChatStatus('generating');

    try {
      let imageToSend = inputImages[0] || '';
      if (imageToSend.startsWith('http')) {
        try {
          const response = await fetch(imageToSend);
          const blob = await response.blob();
          imageToSend = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch(e) {
          setStatus('error');
          setChatStatus('error');
          return;
        }
      }

      const finalPrompt = selectedTemplate.value
        ? `${prompt} ${selectedTemplate.value}`
        : prompt;

      // 调用后端 API 生成图片
      const result = await api.generateImage({
        prompt: finalPrompt,
        image: imageToSend,
        model: selectedModel.id,
        resolution: selectedResolution.id,
        aspectRatio: selectedAspectRatio.id
      });

      // 处理两种可能的返回结构：嵌套(data.image)和平铺(image)
      const imageData = result.data?.image || result.image;
      const balanceData = result.data?.balance ?? result.balance;

      if (result.success && imageData) {
        setGeneratedImage(imageData);
        setChatGeneratedImage(imageData);
        setStatus('success');
        setChatStatus('success');

        // 更新余额显示
        if (balanceData !== undefined && user) {
          setUser({ ...user, balance: balanceData });
        }

        // 刷新历史记录
        const historyResult = await api.getHistory();
        if (historyResult.success && historyResult.data?.history) {
          setHistoryItems(historyResult.data.history);
        }
      } else {
        console.error('生成失败:', result);
        setStatus('error');
        setChatStatus('error');
      }
    } catch (error: any) {
      console.error('生成异常:', error);
      setStatus('error');
      setChatStatus('error');
    }
  };

  // 打开登录模态框
  const [showLoginModal, setShowLoginModal] = useState(false);
  // 标记登录后是否需要自动生成
  const [pendingGenerate, setPendingGenerate] = useState(false);
  
  // 账号密码登录状态
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // 手机号验证码登录状态
  const [loginPhone, setLoginPhone] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  return (
    <div className="min-h-screen bg-background-dark text-gray-100 font-sans antialiased overflow-x-hidden transition-colors duration-300 selection:bg-primary/30">
      <Navbar 
        currentView={currentView} 
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'home') {
            setStatus('idle');
            setGeneratedImage(null);
          }
        }}
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={handleLogin}
        onLoginSuccess={(userData, token) => {
          api.setToken(token);
          setUser(userData);
          setIsVip(userData.isVip || false);
          setIsLoggedIn(true);
        }}
        onOpenLogin={() => setShowLoginModal(true)}
        historyItems={historyItems}
        onHistoryItemClick={handleHistoryItemClick}
        onHistoryDelete={handleHistoryDelete}
        onOpenTasks={async () => {
          // 打开任务列表前先刷新数据 - 使用后端 API
          const result = await api.getHistory();
          if (result.success && result.data?.history) {
            setHistoryItems(result.data.history);
          }
        }}
        onOpenRecharge={() => {
          // 切换到首页再打开充值界面
          if (currentView !== 'home') {
            setCurrentView('home');
             setStatus('idle');
             setGeneratedImage(null);
          }
        }}
        onRechargeSuccess={(newBalance, isVip) => {
          // 充值成功后更新用户状态
          if (user) {
            setUser({ ...user, balance: newBalance, isVip: isVip });
          }
        }} 
      />

      {currentView === 'home' ? (
        <>
          {/* Background Image */}
          <div className="fixed inset-0 z-0">
            <img 
              alt="Modern architecture in nature at night" 
              className="w-full h-full object-cover object-center brightness-[0.4]" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCw1ocrcOxZmH_jlbgHOxOTgwGLwAPwD1HhirngeuAK8O2k_cyM0AGnMnnoZ0E6iT9aqi5fGxboSxL_FfmphwoJX7L0Rxvbu5-5lW0WfY9wuvA5fKy4CLs8rhX4SMuzJSIEnUwZwyLAnB3DYfuP6MOH8CpLQF8VTRl9GFXSJgWPJUrzf8neex01Ou77h-E3tEYGsBMvKcpXUhh7emavUgMhtal7hGutWniKNL7MxAPeiFrMsZxL1pwfuspMpUm1U7onSMJNYeSAzk4"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-background-dark/20 to-black/80"></div>
          </div>

          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />

          <main className="relative z-10 flex flex-col items-center min-h-screen w-full px-4 pt-32 pb-16">
            
            {/* Hero Text */}
            <div className="text-center mb-12 animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 tracking-tight drop-shadow-lg">
                专为建筑生打造的极速智能渲染平台
              </h1>
              <p className="text-lg md:text-2xl text-white/60 font-light tracking-wide max-w-3xl mx-auto">
                内置海量专业提示词，告别繁琐调参，让效率翻倍
              </p>
            </div>

            {/* Main Interaction Area */}
            <div className="w-full max-w-6xl mb-12">
              <div className="bg-[#1a1b1e]/60 glass-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl">
                
                <div className="p-5 flex flex-col lg:flex-row gap-6">
                  
                  {/* Text Area Section */}
                  <div className="flex-1 relative">
                    <div className="absolute top-0 left-0 pt-1">
                      <span className="material-icons text-yellow-400 text-lg">lightbulb</span>
                    </div>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full h-40 lg:h-52 bg-transparent border-none text-white/90 placeholder-white/40 focus:ring-0 resize-none pl-8 pt-1 leading-relaxed text-base lg:text-lg font-light" 
                      placeholder={getPlaceholder()}
                    />
                    <div className="mt-2 absolute bottom-0 left-0">
                      <button 
                        onClick={() => {
                          if (!isLoggedIn) {
                            setPendingGenerate(true);
                            setShowLoginModal(true);
                            return;
                          }
                          setIsPromptMasterOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-md hover:bg-yellow-400/20 transition border border-yellow-400/20 shadow-lg shadow-yellow-900/10"
                      >
                        <span className="material-icons text-sm">auto_awesome</span> 提示词大师
                      </button>
                    </div>
                  </div>

                  {/* Images Preview Section */}
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Input Images - 支持最多3张 */}
                    <div className="flex gap-2">
                      {/* 已有图片展示 */}
                      {inputImages.map((img, index) => (
                        <div key={index} className="w-24 h-24 lg:w-28 lg:h-28 relative group rounded-xl overflow-hidden border border-white/10 bg-black/40">
                          <img 
                            src={img} 
                            alt={`Input ${index + 1}`} 
                            className="w-full h-full object-cover transition-opacity duration-300" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button 
                              onClick={() => triggerFileUpload(index)}
                              className="text-white bg-black/50 p-1.5 rounded-full hover:bg-black/70 transition"
                            >
                              <span className="material-icons text-sm">edit</span>
                            </button>
                            <button 
                              onClick={() => removeImage(index)}
                              className="text-white bg-black/50 p-1.5 rounded-full hover:bg-red-600 transition"
                            >
                              <span className="material-icons text-sm">close</span>
                            </button>
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white/80">{index + 1}</div>
                          {/* 隐藏的单文件输入 */}
                          <input 
                            type="file" 
                            ref={el => fileInputRefs.current[index] = el}
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleFileChange(e, index)}
                          />
                        </div>
                      ))}
                      
                      {/* 添加图片按钮 - 最多3张 */}
                      {inputImages.length < 3 && (
                        <div 
                          onClick={triggerMultiFileUpload}
                          className="w-24 h-24 lg:w-28 lg:h-28 flex-shrink-0 relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 border-dashed cursor-pointer hover:border-white/30 transition"
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 group-hover:text-white/60 transition-colors">
                            <span className="material-icons text-2xl">add</span>
                            <span className="text-[10px] mt-1">添加图片</span>
                          </div>
                        </div>
                      )}
                    </div>

                     {/* Output Image (or Placeholder) - Only show if previously generated or generating (but now we switch view, so this might be redundant, but good to keep for consistency if we allow back navigation without reset) */}
                     { (status === 'success' || generatedImage) && (
                        <div className="w-full md:w-56 lg:w-72 h-40 lg:h-52 flex-shrink-0 relative group rounded-xl overflow-hidden border border-white/10 bg-black/40">
                          {generatedImage ? (
                             <img 
                              src={generatedImage} 
                              alt="Generated" 
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => window.open(generatedImage, '_blank')}
                             />
                          ) : null}
                           <div className="absolute bottom-2 left-2 bg-primary/80 px-2 py-1 rounded text-xs text-white">Output</div>
                        </div>
                     )}
                  </div>

                </div>

                {/* Controls Bar */}
                <div className="border-t border-white/5 p-4 bg-black/20 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <CustomSelect 
                      options={MODEL_OPTIONS} 
                      value={selectedModel} 
                      onChange={setSelectedModel}
                      icon="bolt"
                    />
                    
                    {/* Replaced CustomSelect for Template with custom button to open Library */}
                    <button 
                      onClick={() => setIsPromptLibraryOpen(true)}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs px-4 py-2 rounded-lg transition border border-white/10 group whitespace-nowrap"
                    >
                      <span className="text-white/80">
                        {selectedTemplate.label}
                      </span>
                      <span className="material-icons text-sm text-white/40 group-hover:text-white/80 transition-transform duration-200">
                        expand_more
                      </span>
                    </button>

                    <CustomSelect
                      options={ASPECT_RATIO_OPTIONS}
                      value={selectedAspectRatio}
                      onChange={handleAspectRatioChange}
                      icon="crop_free"
                      isVip={isVip}
                    />

                    <CustomSelect 
                      options={RESOLUTION_OPTIONS} 
                      value={selectedResolution} 
                      onChange={handleResolutionChange}
                      indicatorColor="bg-blue-400"
                      isVip={isVip}
                    />
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <span className="text-white/50 text-xs hidden sm:inline">上传图片 ({inputImages.length}/3)</span>
                    <button 
                      onClick={handleGenerate}
                      disabled={status === 'generating'}
                      className={`
                        ${status === 'generating' ? 'bg-gray-600 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover hover:scale-105'}
                        text-white text-sm font-bold px-10 py-2.5 rounded-lg shadow-xl transition-all transform
                      `}
                    >
                      {status === 'generating' ? '生成中...' : '生成'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery / Presets */}
            <div className="w-[80%] max-w-[1920px] px-4 md:px-12 mt-auto mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {GALLERY_ITEMS.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleGalleryClick(item)}
                    className="relative group rounded-2xl overflow-hidden cursor-pointer aspect-[1.2] border border-white/10 shadow-2xl transition-all hover:translate-y-[-4px]"
                  >
                    <img 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      src={item.image} 
                    />
                    <div className="absolute inset-0 card-gradient-overlay opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    <div className="absolute bottom-6 left-0 right-0 text-center flex flex-col items-center gap-1">
                      <span className="text-white/90 font-medium text-sm tracking-widest">{item.title}</span>
                    </div>
                    {/* Active Indicator or Hover Action */}
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-primary text-white text-[10px] px-2 py-1 rounded-full">Try This</span>
                     </div>
                  </div>
                ))}
              </div>
            </div>

          </main>
          
          <PromptMaster 
            isOpen={isPromptMasterOpen} 
            onClose={() => setIsPromptMasterOpen(false)}
            initialPrompt={prompt}
            onApply={(optimizedPrompt) => {
              setPrompt(optimizedPrompt);
            }}
          />
          
          <PromptLibrary
            isOpen={isPromptLibraryOpen}
            onClose={() => setIsPromptLibraryOpen(false)}
            onSelect={(option, category) => {
              setSelectedTemplate(option);
              // 选择模板后更新templateCategory以改变输入框placeholder
              if (category) {
                setTemplateCategory(category);
              }
              // 选择模板后直接使用新的提示词替换
              if (option.value) {
                setPrompt(option.value);
              } else {
                // 如果选择"无"，清空提示词
                setPrompt('');
              }
            }}
          />

          {/* VIP Upgrade Modal */}
          {showVipModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
                onClick={() => setShowVipModal(false)}
              ></div>
              <div className="relative bg-gradient-to-br from-[#1a1b1e] to-[#0d0d0f] border border-yellow-500/30 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-yellow-500/20 to-transparent"></div>

                <div className="relative p-8 flex flex-col items-center text-center">
                  {/* VIP Icon with animation */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-30 rounded-full animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30 animate-bounce">
                      <span className="text-4xl">👑</span>
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-xl mb-2">VIP 会员专属</h3>
                  <p className="text-white/60 text-sm mb-6">{vipMessage}</p>

                  {/* Benefits */}
                  <div className="w-full bg-white/5 rounded-xl p-4 mb-6">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-3">解锁权益</div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-white/70">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">✨</span>
                        <span>4K超清</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">⚡</span>
                        <span>优先排队</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">🎯</span>
                        <span>专属客服</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowVipModal(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl text-sm font-medium transition-all"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        setShowVipModal(false);
                        // 触发打开充值界面
                        document.querySelector<HTMLButtonElement>('span.hover\\:text-white')?.click();
                      }}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/30"
                    >
                      升级 VIP
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

        </>
      ) : (
        <ChatInterface 
          prompt={chatPrompt || prompt}
          inputImage={chatInputImage || inputImages[0] || ''}
          generatedImage={chatGeneratedImage || generatedImage}
          status={chatStatus || status}
          onBack={handleBackToHome}
          onRegenerate={handleChatRegenerate}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default App;