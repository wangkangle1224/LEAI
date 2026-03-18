import React, { useState, useEffect, useRef } from 'react';
import { optimizePrompt, checkPromptAPI, getToken } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

interface PromptMasterProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onApply?: (optimizedPrompt: string) => void;
}

export const PromptMaster: React.FC<PromptMasterProps> = ({ 
  isOpen, 
  onClose, 
  initialPrompt = '',
  onApply
}) => {
  const [inputText, setInputText] = useState(initialPrompt);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ available: boolean; provider: string }>({ available: false, provider: '' });
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 检查 API 状态
  useEffect(() => {
    if (isOpen) {
      checkPromptAPI().then(res => {
        if (res.success) {
          setApiStatus({
            available: res.data?.available || false,
            provider: res.data?.provider || '未知'
          });
        }
      });
    }
  }, [isOpen]);

  // 当打开时，如果有关联图片，从页面获取
  useEffect(() => {
    if (isOpen) {
      // 从页面获取当前图片
      const imgElement = document.querySelector('.preview-image') as HTMLImageElement;
      if (imgElement?.src) {
        setAttachedImages([imgElement.src]);
      }
    }
  }, [isOpen]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    
    // 添加用户消息
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '', isLoading: true }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // 调用优化 API
      const history = messages
        .filter(m => !m.isLoading)
        .map(m => ({ role: m.role, content: m.content }));
      
      const response = await optimizePrompt(userMessage, history);
      
      if (response.success && response.data?.optimized) {
        setMessages([
          ...newMessages.slice(0, -1),
          { role: 'assistant', content: response.data.optimized }
        ]);
      } else {
        setMessages([
          ...newMessages.slice(0, -1),
          { role: 'assistant', content: '优化失败: ' + (response.error?.message || '未知错误') }
        ]);
      }
    } catch (error: any) {
      setMessages([
        ...newMessages.slice(0, -1),
        { role: 'assistant', content: '请求失败: ' + error.message }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApply = (optimizedText: string) => {
    if (onApply) {
      onApply(optimizedText);
      onClose();
    }
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-[#1a1b1e] shadow-2xl z-[60] border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300 font-sans">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#1a1b1e]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center">
              <span className="material-icons text-sm text-white">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-base">提示词大师</h2>
              <p className="text-[10px] text-white/40">
                {apiStatus.available 
                  ? `AI: ${apiStatus.provider}` 
                  : '检查 API 配置...'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#141517]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
              <span className="material-icons text-3xl text-yellow-400">auto_awesome</span>
            </div>
            <h3 className="text-white font-bold mb-2">AI 提示词优化</h3>
            <p className="text-white/40 text-xs">
              输入您想要的效果描述，AI 将为您生成专业的英文提示词
            </p>
            {attachedImages.length > 0 && (
              <div className="mt-4 flex gap-2 flex-wrap justify-center">
                {attachedImages.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} className="w-16 h-12 object-cover rounded-md border border-white/10" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="space-y-3">
              {/* User Message */}
              {msg.role === 'user' && (
                <div className="flex items-start justify-end gap-2">
                  <div className="flex flex-col items-end gap-1 max-w-[85%]">
                    <div className="bg-primary text-white text-sm px-4 py-3 rounded-2xl rounded-tr-none shadow-lg shadow-blue-900/20">
                      <span className="font-bold text-white/70 text-xs block mb-1">大白话：</span>
                      {msg.content}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center border border-white/10">
                      <span className="material-icons text-xs text-white">person</span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Message */}
              {msg.role === 'assistant' && (
                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center shadow-lg">
                      <span className="material-icons text-xs text-white">auto_awesome</span>
                    </div>
                  </div>
                  <div className="flex-1 max-w-[90%]">
                    {msg.isLoading ? (
                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none">
                        <div className="flex items-center gap-2 text-white/50 text-xs">
                          <span className="material-icons text-sm animate-spin">sync</span>
                          AI 优化中...
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none">
                        <div className="text-xs text-primary font-bold mb-1">专业话术：</div>
                        <div className="text-xs leading-relaxed text-white/80 whitespace-pre-wrap break-words">
                          {msg.content}
                        </div>
                        {msg.content && !msg.content.includes('失败') && (
                          <button
                            onClick={() => handleApply(msg.content)}
                            className="mt-3 w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium rounded-lg transition flex items-center justify-center gap-1"
                          >
                            <span className="material-icons text-sm">check</span>
                            使用此提示词
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-[#1a1b1e]">
        <div className="bg-black/40 border border-white/10 rounded-xl p-3 focus-within:border-white/20 transition-colors">
          {/* Attached Images */}
          {attachedImages.length > 0 && (
            <div className="mb-2 flex gap-2 flex-wrap">
              {attachedImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} className="w-14 h-10 object-cover rounded-md border border-white/10" />
                  <button 
                    onClick={() => handleRemoveImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <span className="material-icons text-[8px] text-white">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <textarea 
            className="w-full bg-transparent border-none text-white text-xs resize-none h-16 py-1 focus:ring-0 placeholder-white/30 leading-relaxed custom-scrollbar"
            placeholder="描述你想要的效果，如：把建筑变成中式风格..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <button 
              onClick={() => {
                // 触发文件选择
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setAttachedImages(prev => [...prev, ev.target?.result as string]);
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition rounded-lg hover:bg-white/5 border border-white/5"
            >
              <span className="material-icons text-lg">add_photo_alternate</span>
            </button>
            <button 
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className="w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary-hover disabled:bg-white/10 disabled:text-white/20 text-white rounded-lg shadow-lg transition-all"
            >
              <span className="material-icons text-sm">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
