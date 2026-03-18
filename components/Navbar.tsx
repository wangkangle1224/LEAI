import React, { useState, useEffect } from 'react';
import { GALLERY_ITEMS } from '../constants';
import * as api from '../services/api';
import type { User, HistoryItem } from '../services/api';

type ModalType = 'login' | 'tasks' | 'invite' | 'recharge' | 'contact' | null;

interface NavbarProps {
  currentView: 'home' | 'chat';
  onNavigate: (view: 'home' | 'chat') => void;
  isLoggedIn: boolean;
  user: User | null;
  onLogin: () => void;
  onLoginSuccess?: (user: User, token: string) => void; // 登录成功回调
  onOpenLogin?: () => void; // 打开登录模态框
  historyItems?: HistoryItem[];
  onHistoryItemClick?: (item: HistoryItem) => void;
  onHistoryDelete?: (id: string) => void;
  onOpenRecharge?: () => void;
  onRechargeSuccess?: (newBalance: number, isVip: boolean) => void; // 充值成功回调
  onOpenTasks?: () => void; // 打开任务列表时刷新数据
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isLoggedIn,
  user,
  onLogin,
  onLoginSuccess,
  onOpenLogin,
  historyItems = [],
  onHistoryItemClick,
  onHistoryDelete,
  onOpenRecharge,
  onRechargeSuccess,
  onOpenTasks
}) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [rechargeOption, setRechargeOption] = useState(2);
  const [displayHistory, setDisplayHistory] = useState<HistoryItem[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // 登录/注册表单状态
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 当 onOpenLogin 被调用时，打开登录模态框
  useEffect(() => {
    if (onOpenLogin && !isLoggedIn) {
      setActiveModal('login');
    }
  }, [onOpenLogin, isLoggedIn]);

  const closeModal = () => {
    setActiveModal(null);
    // 重置表单
    setAuthMode('login');
    setPhone('');
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setIsLoading(false);
  };

  // 验证码倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 使用传入的 historyItems，不重复获取
  useEffect(() => {
    if (activeModal === 'tasks' && historyItems.length > 0) {
      setDisplayHistory(historyItems);
    }
  }, [activeModal, historyItems]);

  // 获取验证码 - 前端模拟
  const handleGetCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    
    // 模拟发送验证码成功
    setCountdown(60); // 60秒倒计时
    setError('验证码已发送（演示模式验证码: 123456）');
  };

  // 处理登录/注册 - 调用后端 API
  const handleSubmit = async () => {
    setError('');

    if (!phone || !code) {
      setError('请填写完整信息');
      return;
    }

    if (authMode === 'register' && (!password || password.length < 6)) {
      setError('密码长度至少6位');
      return;
    }

    if (authMode === 'register' && password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    // 演示模式：验证码必须为123456
    if (code !== '123456') {
      setError('验证码错误，请输入123456');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (authMode === 'register') {
        // 注册
        result = await api.register(phone, code, password);
      } else {
        // 登录
        result = await api.login(phone, code);
      }
      
      if (result.success && result.token && result.user) {
        api.setToken(result.token);
        closeModal();
        
        if (onLoginSuccess) {
          onLoginSuccess(result.user, result.token);
        } else {
          onLogin();
        }
      } else {
        setError(result.error?.message || (authMode === 'register' ? '注册失败' : '登录失败'));
      }
    } catch (error) {
      console.error('登录/注册失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 切换登录/注册模式
  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setError('');
    setCode('');
    setPassword('');
    setConfirmPassword('');
  };

  // 删除历史记录 - 使用后端 API
  const handleDelete = async (id: string) => {
    if (isDeleting) return;

    try {
      setIsDeleting(id);
      const result = await api.deleteHistory(id);

      if (result.success) {
        // 立即从显示列表中移除
        setDisplayHistory(prev => prev.filter(item => item.id !== id));
        // 通知 App 更新全局状态
        onHistoryDelete?.(id);
      } else {
        alert('删除失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('删除错误:', error);
      alert('删除失败，请重试');
    } finally {
      setIsDeleting(null);
    }
  };

  // 打开充值界面
  const handleOpenRecharge = () => {
    if (!isLoggedIn) {
      // 未登录，先打开登录
      onOpenLogin?.();
      return;
    }
    onOpenRecharge?.();
    setActiveModal('recharge');
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 border-b border-white/5 bg-black/10 backdrop-blur-md">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
              <div 
                className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
                onClick={() => onNavigate('home')}
              >
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center transform skew-x-[-12deg]">
                  <span className="text-white font-bold text-lg skew-x-[12deg]">L</span>
                </div>
                <span className="font-display font-bold text-2xl text-white tracking-tight flex items-baseline gap-2">
                  LEAI <span className="text-sm font-normal text-white/70">建筑大师</span>
                </span>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center space-x-8">
                  <a 
                    className={`${currentView === 'home' ? 'text-white font-bold' : 'text-white/80 hover:text-white font-medium'} text-sm transition-colors cursor-pointer`}
                    onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
                  >
                    首页
                  </a>
                  <a 
                    className={`relative ${currentView === 'chat' ? 'text-white font-bold' : 'text-white/80 hover:text-white font-medium'} text-sm transition-colors cursor-pointer`}
                    onClick={(e) => { e.preventDefault(); onNavigate('chat'); }}
                  >
                    AI对话改图
                    <span className="absolute -top-4 -right-6 flex h-4 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-1 text-[9px] text-white whitespace-nowrap">🔥香蕉模型</span>
                  </a>
                  <button 
                    onClick={() => setActiveModal('contact')}
                    className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                  >
                    联系我们
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {isLoggedIn && user ? (
              <div className="flex items-center text-xs text-white/60 gap-4 cursor-pointer select-none">
                  <span className="hover:text-white transition-colors" onClick={() => {
                    onOpenTasks?.(); // 通知父组件刷新数据
                    setActiveModal('tasks');
                  }}>任务列表</span>
                <span className="hover:text-white transition-colors" onClick={() => setActiveModal('invite')}>邀请奖励</span>
                  <span className="hover:text-white transition-colors" onClick={handleOpenRecharge}>金币充值</span>
              </div>
              ) : (
                <div className="flex items-center text-xs text-white/40 gap-4">
                  <span className="text-white/30">登录后解锁更多功能</span>
                </div>
              )}
              <div className="h-4 w-px bg-white/20"></div>
                {isLoggedIn && user ? (
                  // 已登录状态
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <img 
                        src={user.avatar} 
                        alt={user.nickname}
                        className="w-8 h-8 rounded-full border border-white/20"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-xs font-medium">{user.nickname}</span>
                          {user.isVip && (
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 shadow-lg animate-pulse">
                              <span className="text-[8px]">👑</span>
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-yellow-400 text-[10px] flex items-center gap-1">
                          <span className="material-icons text-[10px]">monetization_on</span>
                          {user.balance} 金币
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 未登录状态
              <button 
                    onClick={onLogin}
                className="bg-[#07C160] hover:bg-[#06ad56] text-white px-5 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-green-900/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                手机登录
              </button>
                )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          
          {/* Login/Register Modal */}
          {activeModal === 'login' && (
            <div className="relative bg-[#1a1b1e] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-8 py-6 border-b border-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="relative flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30 mb-3">
                    <span className="material-icons text-white text-2xl">architecture</span>
                  </div>
                  <h2 className="text-white text-xl font-bold">
                    {authMode === 'login' ? '欢迎回来' : '创建账号'}
                  </h2>
                  <p className="text-white/50 text-xs mt-1">
                    {authMode === 'login' ? '登录 LEAI，解锁 AI 建筑渲染超能力' : '注册 LEAI，开启 AI 渲染之旅'}
                  </p>
                </div>
              </div>

              {/* Auth Form */}
              <div className="p-8 space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Phone Input */}
                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs font-medium ml-1">手机号码</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 material-icons text-sm">phone</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入手机号"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>

                {/* Verification Code */}
                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs font-medium ml-1">验证码</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 material-icons text-sm">verified_user</span>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="请输入验证码"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all pr-28"
                    />
                    <button
                      onClick={handleGetCode}
                      disabled={countdown > 0 || !phone}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-primary text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>

                {/* Password (Register only) */}
                {authMode === 'register' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-white/60 text-xs font-medium ml-1">设置密码</label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 material-icons text-sm">lock</span>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="请设置密码（至少6位）"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-white/60 text-xs font-medium ml-1">确认密码</label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 material-icons text-sm">lock_reset</span>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="请再次输入密码"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary-hover hover:to-primary/70 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="material-icons text-sm animate-spin">refresh</span>
                  ) : (
                    <span className="material-icons text-sm">{authMode === 'login' ? 'login' : 'person_add'}</span>
                  )}
                  {isLoading ? '请稍候...' : (authMode === 'login' ? '立即登录' : '注册账号')}
                </button>

                {/* Toggle Mode */}
                <p className="text-center text-white/40 text-xs mt-4">
                  {authMode === 'login' ? '还没有账号？' : '已有账号？'}
                  <button
                    onClick={toggleAuthMode}
                    className="text-primary hover:underline ml-1 font-medium"
                  >
                    {authMode === 'login' ? '立即注册' : '去登录'}
                  </button>
                </p>

                {/* Terms */}
                <p className="text-center text-white/30 text-[10px] mt-2">
                  注册/登录即表示同意 <a href="#" className="text-primary hover:underline">服务条款</a> 和 <a href="#" className="text-primary hover:underline">隐私政策</a>
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
          )}

          {/* Task List (History) Modal */}
          {activeModal === 'tasks' && (
             <div className="relative bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <h3 className="text-white font-medium pl-2 flex items-center gap-2">
                    <span className="material-icons text-blue-400">history</span> 
                    生成历史
                  </h3>
                  <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                    <span className="material-icons text-sm">close</span>
                  </button>
                </div>
                
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                   {displayHistory.length > 0 ? (
                     displayHistory.map((item) => (
                      <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/20">
                         <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                         />
                         {/* 状态标签 */}
                         <div className="absolute top-2 left-2 z-10">
                            <div className="bg-[#07C160]/90 text-white text-[9px] px-2 py-0.5 rounded-full shadow-sm backdrop-blur-md flex items-center gap-1">
                               <span className="w-1 h-1 rounded-full bg-white"></span>
                               完成
                            </div>
                         </div>
                         {/* 删除按钮 - 始终可见 */}
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             if (isDeleting) return;
                             handleDelete(item.id);
                           }}
                           disabled={isDeleting === item.id}
                           className="absolute top-2 right-2 z-30 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110 disabled:opacity-50"
                           title="删除"
                         >
                            {isDeleting === item.id ? (
                              <span className="material-icons text-sm animate-spin">refresh</span>
                            ) : (
                              <span className="material-icons text-sm">delete</span>
                            )}
                         </button>
                         {/* 底部信息 */}
                         <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-3 z-20">
                            <span className="text-white text-xs font-medium truncate block">{item.title}</span>
                            <span className="text-[10px] text-white/50">{item.createdAt}</span>
                         </div>
                         {/* 点击整个卡片查看详情 */}
                         <div
                           className="absolute inset-0 z-10 cursor-pointer"
                           onClick={() => {
                             onHistoryItemClick?.(item);
                             closeModal();
                           }}
                         />
                      </div>
                     ))
                   ) : (
                     GALLERY_ITEMS.slice(0, 8).map((item, index) => (
                      <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/20 cursor-pointer">
                         <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <div className="flex items-center justify-between">
                               <span className="text-white text-xs font-medium truncate flex-1 mr-2">{item.title}</span>
                               <button
                                 onClick={() => window.open(item.image, '_blank')}
                                 className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-full backdrop-blur-md transition"
                               >
                                  <span className="material-icons text-xs">download</span>
                               </button>
                            </div>
                            <div className="text-[10px] text-white/40 mt-1">2024-03-{10 + index}</div>
                         </div>
                         <div className="absolute top-2 right-2">
                            <div className="bg-[#07C160]/90 text-white text-[9px] px-2 py-0.5 rounded-full shadow-sm backdrop-blur-md flex items-center gap-1">
                               <span className="w-1 h-1 rounded-full bg-white"></span>
                               完成
                            </div>
                         </div>
                      </div>
                     ))
                   )}
                </div>
                <div className="p-3 border-t border-white/5 bg-black/20 flex justify-center">
                    <button className="text-[10px] text-white/40 hover:text-white transition-colors">
                        仅展示最近30条记录
                    </button>
                </div>
             </div>
          )}

          {/* Invite Rewards Modal */}
          {activeModal === 'invite' && (
            <div className="relative bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="flex items-center justify-between p-4 border-b border-white/5">
                 <h3 className="text-white font-bold pl-2 flex items-center gap-2">
                   <span className="material-icons text-orange-500">card_giftcard</span> 
                   邀请有礼
                 </h3>
                 <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                   <span className="material-icons text-sm">close</span>
                 </button>
               </div>
               <div className="p-6">
                  {/* Invite Code Card */}
                  <div className="bg-[#3a2020] p-6 rounded-xl border border-orange-500/20 mb-5 text-center shadow-inner relative overflow-hidden">
                     {/* Decorative subtle glow */}
                     <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none"></div>
                     
                     <div className="text-white/50 text-xs mb-3 font-medium">我的专属邀请码</div>
                     <div className="text-3xl font-sans font-bold text-white tracking-wider flex items-center justify-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
                        LEA888 
                        <span className="material-icons text-white/30 text-base">content_copy</span>
                     </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="bg-[#232428] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
                        <div className="text-white/40 text-xs">已邀请</div>
                        <div className="text-white font-bold text-xl">
                          {isLoggedIn && user ? user.invitedCount : 0} 
                          <span className="text-xs font-normal text-white/40">人</span>
                        </div>
                     </div>
                     <div className="bg-[#232428] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
                        <div className="text-white/40 text-xs">累计奖励</div>
                        <div className="text-yellow-400 font-bold text-xl">
                          {isLoggedIn && user ? user.totalReward : 0} 
                          <span className="text-xs font-normal text-white/40">金币</span>
                        </div>
                     </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#F53C3C] hover:from-[#ff7b4d] hover:to-[#ff4d4d] text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-900/20 transition-all text-sm tracking-wide">
                     生成海报分享
                  </button>
               </div>
            </div>
          )}

          {/* Recharge Modal */}
          {activeModal === 'recharge' && (
            <div className="relative bg-gradient-to-br from-[#1a1b1e] to-[#0d0d0f] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
               {/* Header with gradient */}
               <div className="relative bg-gradient-to-r from-yellow-500/20 via-orange-500/10 to-red-500/20 p-6 border-b border-white/5">
                 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUvNSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

                 <div className="relative flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                       <span className="material-icons text-white text-xl">workspace_premium</span>
                     </div>
                     <div>
                       <h3 className="text-white font-bold text-xl">会员充值</h3>
                       <p className="text-white/50 text-xs mt-0.5">充值金币，升级 VIP 解锁更多权益</p>
                     </div>
                   </div>
                   <button onClick={closeModal} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                   <span className="material-icons text-sm">close</span>
                 </button>
                 </div>
               </div>
               
               <div className="p-6">
                  {/* Balance Card */}
                  <div className="relative bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-5 mb-6 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                    <div className="relative flex items-center justify-between">
                      <div>
                        <span className="text-white/60 text-xs uppercase tracking-wider">当前余额</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            {isLoggedIn && user ? user.balance : 0}
                          </span>
                          <span className="text-white/60 text-lg">金币</span>
                        </div>
                      </div>
                      {isLoggedIn && user?.isVip && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                          <span className="text-sm">👑</span>
                          <span className="text-white text-xs font-bold">VIP 已开通</span>
                        </div>
                      )}
                      </div>
                  </div>
                  
                  {/* VIP Banner */}
                  {!(isLoggedIn && user?.isVip) && (
                    <div className="relative bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4 mb-6 overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-50"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-lg">👑</span>
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">升级 VIP 享专属权益</div>
                            <div className="text-white/50 text-xs mt-0.5">4K超清 · 专属客服 · 优先排队</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setRechargeOption(3)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30"
                        >
                          立即升级
                        </button>
                      </div>
                    </div>
                  )}

                  <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full"></span>
                    选择充值套餐
                  </h4>
                  
                  {/* Packages Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                      {/* Package 1 */}
                      <div 
                        onClick={() => setRechargeOption(1)}
                        className={`relative cursor-pointer p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                          rechargeOption === 1
                            ? 'bg-gradient-to-b from-blue-500/20 to-cyan-500/10 border-2 border-blue-500 shadow-lg shadow-blue-500/20 transform -translate-y-1'
                            : 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                          {rechargeOption === 1 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="material-icons text-white text-sm">check</span>
                            </div>
                          )}
                          <div className="text-white/60 text-xs">基础套餐</div>
                          <div className="text-white font-bold text-lg">100 <span className="text-xs font-normal text-white/40">金币</span></div>
                          <div className="text-blue-400 font-bold text-xl">¥9.9</div>
                      </div>

                      {/* Package 2 */}
                      <div 
                        onClick={() => setRechargeOption(2)}
                        className={`relative cursor-pointer p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                          rechargeOption === 2
                            ? 'bg-gradient-to-b from-red-500/20 to-orange-500/10 border-2 border-red-500 shadow-lg shadow-red-500/20 transform -translate-y-1'
                            : 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg">热销</div>
                          {rechargeOption === 2 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="material-icons text-white text-sm">check</span>
                            </div>
                          )}
                          <div className="text-white/60 text-xs mt-2">进阶套餐</div>
                          <div className="text-white font-bold text-lg">500 <span className="text-xs font-normal text-white/40">金币</span></div>
                          <div className="text-red-400 font-bold text-xl">¥39.9</div>
                          <div className="text-white/30 text-[10px] line-through">¥49.9</div>
                      </div>

                      {/* Package 3 */}
                      <div 
                        onClick={() => setRechargeOption(3)}
                        className={`relative cursor-pointer p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                          rechargeOption === 3
                            ? 'bg-gradient-to-b from-yellow-500/20 to-orange-500/10 border-2 border-yellow-500 shadow-lg shadow-yellow-500/20 transform -translate-y-1'
                            : 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg">VIP必备</div>
                          {rechargeOption === 3 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="material-icons text-black text-sm">check</span>
                            </div>
                          )}
                          <div className="text-white/60 text-xs mt-2">豪华套餐</div>
                          <div className="text-white font-bold text-lg">2000 <span className="text-xs font-normal text-white/40">金币</span></div>
                          <div className="text-yellow-400 font-bold text-xl">¥128</div>
                          <div className="text-white/30 text-[10px] line-through">¥199</div>
                      </div>
                  </div>

                  {/* VIP Benefits */}
                  {rechargeOption === 3 && (
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-400 text-sm">🎁</span>
                        <span className="text-white/80 text-xs font-bold">VIP 专属权益</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-white/50">
                        <div className="flex items-center gap-1">
                          <span className="material-icons text-green-400 text-xs">verified</span>
                          4K超清分辨率
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-icons text-green-400 text-xs">verified</span>
                          专属客服
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-icons text-green-400 text-xs">verified</span>
                          优先排队
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIP upgrade hint */}
                  {rechargeOption !== 3 && !(isLoggedIn && user?.isVip) && (
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 mb-4">
                      <span className="text-yellow-400">💡</span>
                      <span className="text-white/60 text-xs">充值满 2000 金币自动升级 VIP，享 4K 超清</span>
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      const amounts = [100, 500, 2000];
                      const amount = amounts[rechargeOption - 1];

                      if (!isLoggedIn) {
                        alert('请先登录后再充值');
                        setActiveModal(null);
                        return;
                      }

                      // 使用后端 API 创建充值订单
                      const result = await api.createRecharge(rechargeOption);
                      if (result.success) {
                        setActiveModal(null);
                        const newBalance = result.data?.newBalance || 0;
                        const isVip = result.data?.isVip || false;
                        const vipMsg = result.data?.vipUpgraded ? '\n🎉 恭喜您已成为VIP会员！' : '';
                        const isVipMsg = isVip ? 'VIP会员' : '普通用户';
                        
                        // 调用充值成功回调，更新父组件状态
                        onRechargeSuccess?.(newBalance, isVip);
                        
                        setTimeout(() => {
                          alert(`充值成功！当前余额: ${newBalance} 金币\n身份: ${isVipMsg}${vipMsg}`);
                        }, 300);
                      } else {
                        alert(result.error?.message || '充值失败，请重试');
                      }
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    立即充值 ¥{rechargeOption === 1 ? '9.9' : rechargeOption === 2 ? '39.9' : '128'}
                  </button>

                  <div className="text-center mt-4">
                     <p className="text-white/20 text-[10px]">
                      充值即代表同意 <span className="hover:text-white/40 cursor-pointer underline decoration-white/20">《用户充值协议》</span>
                    </p>
                  </div>
               </div>
            </div>
          )}

          {/* Contact Us Modal */}
          {activeModal === 'contact' && (
            <div className="relative bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="flex items-center justify-between p-4 border-b border-white/5">
                 <h3 className="text-white font-medium pl-2 flex items-center gap-2">
                   <span className="material-icons text-blue-400">contact_support</span> 
                   联系我们
                 </h3>
                 <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                   <span className="material-icons text-sm">close</span>
                 </button>
               </div>
               <div className="p-6 space-y-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-colors">
                     <div className="w-12 h-12 bg-[#07C160]/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 fill-[#07C160]" viewBox="0 0 24 24"><path d="M8.73 15.86c3.97 0 7.19-2.92 7.19-6.53 0-3.61-3.22-6.53-7.19-6.53-3.98 0-7.2 2.92-7.2 6.53 0 2.06 1.05 3.9 2.69 5.09-.12.44-.45 1.15-.52 1.32-.09.21-.04.4.15.28.18-.11 1.48-.86 1.7-.98.39.08.79.12 1.18.12zm10.74 3.9c0-.23-.02-.46-.06-.69 2.76-1.07 4.59-3.4 4.59-6.04 0-2.45-1.58-4.63-3.99-5.78-.34 3.98-4.04 7.04-8.32 6.58 1.06 3.01 4.25 4.96 7.78 5.93z" /></svg>
                     </div>
                     <div>
                        <div className="text-white/40 text-xs mb-1">官方微信</div>
                        <div className="text-white font-medium select-all cursor-text">LEAI_Official</div>
                     </div>
                  </div>
                  
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-colors">
                     <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="material-icons text-blue-500">email</span>
                     </div>
                     <div>
                        <div className="text-white/40 text-xs mb-1">商务邮箱</div>
                        <div className="text-white font-medium select-all cursor-text">contact@leai.com</div>
                     </div>
                  </div>

                  <div className="text-center text-white/20 text-xs pt-2">
                     工作时间: 周一至周五 9:00 - 18:00
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};