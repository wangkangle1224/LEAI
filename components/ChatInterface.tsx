import React, { useState, useEffect, useRef } from 'react';
import { GenerationStatus } from '../types';

interface ChatInterfaceProps {
  prompt: string;
  inputImage: string;
  generatedImage: string | null;
  status: GenerationStatus;
  onBack: () => void;
  onRegenerate: (newPrompt: string) => void;
  onDownload: (imageUrl: string) => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  image?: string;
  type?: 'result';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  prompt,
  inputImage,
  generatedImage,
  status,
  onBack,
  onRegenerate,
  onDownload,
}) => {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Generation progress state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [queueNum, setQueueNum] = useState(1);
  
  // Initialize chat with the prompt
  useEffect(() => {
    setMessages([
      { role: 'user', content: prompt, image: inputImage }
    ]);
  }, [prompt, inputImage]);

  // Timer effect for generation
  useEffect(() => {
    let interval: any;
    if (status === 'generating') {
      setElapsedTime(0);
      setQueueNum(Math.floor(Math.random() * 3) + 2);
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Update chat when status changes
  useEffect(() => {
    if (status === 'success' && generatedImage) {
       setMessages(prev => {
         if (prev.length > 0 && prev[prev.length - 1].role === 'ai' && prev[prev.length - 1].type === 'result') return prev;
         
         return [
           ...prev, 
           { role: 'ai', type: 'result', content: '根据您的描述，我为您生成了这张效果图。您可以继续与我对话来调整细节。', image: generatedImage }
         ];
       });
    } else if (status === 'error') {
       setMessages(prev => [
         ...prev, 
         { role: 'ai', content: '抱歉，生成过程中出现了错误，请重试。' }
       ]);
    }
  }, [status, generatedImage]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Handle sending message
  const handleSendMessage = () => {
    if (!inputText.trim() || status === 'generating') return;

    // Add user message
    const userMessage: Message = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);

    // Call regenerate with combined prompt
    const newPrompt = `${prompt} ${inputText}`;
    onRegenerate(newPrompt);

    setInputText('');
  };

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    const quickPrompts: Record<string, string> = {
      '更有氛围感': '，更有氛围感，戏剧性灯光',
      '变为夜景': '，变为夜景，霓虹灯效果',
      '鸟瞰视角': '，鸟瞰视角，俯视图',
      '暖色调': '，暖色调灯光',
      '冷色调': '，冷色调灯光',
      '手绘风格': '，手绘草图风格',
    };

    const suffix = quickPrompts[action] || `，${action}`;
    const newPrompt = `${prompt}${suffix}`;

    // Add AI thinking message
    setMessages(prev => [
      ...prev,
      { role: 'user', content: action },
      { role: 'ai', content: `好的，我来为您生成${action}的效果图...` }
    ]);

    onRegenerate(newPrompt);
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle download
  const handleDownloadClick = (imageUrl: string) => {
    if (!imageUrl) return;
    onDownload(imageUrl);
  };

  // Handle regenerate this image
  const handleRegenerate = () => {
    onRegenerate(prompt);
  };

  return (
    <div className="flex h-screen pt-16 bg-background-dark overflow-hidden font-sans">
       {/* Left: Image Canvas */}
       <div className="flex-1 bg-[#0b0c10] relative flex items-center justify-center p-8 overflow-hidden">
          {/* Background Grid/Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          </div>

          {/* Main Image Display */}
          <div className="relative w-full h-full flex items-center justify-center">
              {status === 'generating' ? (
                 <div className="flex flex-col items-center gap-6 z-10">
                    <div className="relative w-20 h-20">
                       <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                       <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <span className="material-icons text-white/20 text-3xl">auto_awesome</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-white/90 font-medium text-lg tracking-wide">正在极速渲染...</div>
                      <div className="text-white/40 text-xs font-mono">Nano Banana Model</div>
                    </div>
                 </div>
              ) : (
                 <div className="relative w-full h-full flex items-center justify-center">
                 <img 
                   src={generatedImage || inputImage} 
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg ring-1 ring-white/10 cursor-zoom-in"
                   alt="Main View"
                      onClick={() => generatedImage && window.open(generatedImage, '_blank')}
                    />
                    {/* Regenerate button */}
                    {generatedImage && (
                      <button
                        onClick={handleRegenerate}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full transition-all border border-white/20"
                      >
                        <span className="material-icons text-sm">refresh</span>
                        <span className="text-sm">重新生成</span>
                      </button>
                    )}
                 </div>
              )}
          </div>

          {/* Back Button */}
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white bg-black/40 hover:bg-black/60 px-4 py-2 rounded-full transition-all backdrop-blur-sm border border-white/5 z-20 hover:pl-3 group"
          >
            <span className="material-icons text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="text-sm font-medium">返回首页</span>
          </button>

          {/* Download Button */}
          {generatedImage && (
            <button
              onClick={() => handleDownloadClick(generatedImage)}
              className="absolute top-6 right-6 flex items-center gap-2 text-white/60 hover:text-white bg-black/40 hover:bg-black/60 px-4 py-2 rounded-full transition-all backdrop-blur-sm border border-white/5 z-20 hover:pr-3 group"
            >
              <span className="material-icons text-sm group-hover:translate-y-0.5 transition-transform">download</span>
              <span className="text-sm font-medium">下载</span>
            </button>
          )}
       </div>

       {/* Right: Chat Panel */}
       <div className="w-[380px] bg-[#1a1b1e] border-l border-white/10 flex flex-col shadow-2xl z-20 relative">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1a1b1e]/95 backdrop-blur z-10">
             <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                乐小建 AI
             </h3>
             <button
               onClick={handleRegenerate}
               className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition"
               disabled={status === 'generating'}
             >
                <span className="material-icons text-sm">refresh</span>
                重新生成
             </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[#141517]">
             {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   {/* Username Display */}
                   {msg.role === 'user' && (
                       <span className="text-[10px] text-white/40 mr-11 mb-1">你</span>
                   )}
                   
                   <div className={`flex items-start gap-3 max-w-full ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 flex-shrink-0 mt-0.5 shadow-lg ${msg.role === 'user' ? 'bg-primary' : 'bg-[#7c3aed]'}`}>
                         <span className="material-icons text-xs text-white">{msg.role === 'user' ? 'person' : 'smart_toy'}</span>
                      </div>

                      {/* Content */}
                      <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {msg.content && (
                            <div className={`p-3.5 text-sm leading-relaxed shadow-md ${
                               msg.role === 'user' 
                                 ? 'bg-primary text-white rounded-2xl rounded-tr-sm' 
                                 : 'bg-[#2C2E33] border border-white/5 text-white/90 rounded-2xl rounded-tl-sm'
                            }`}>
                               {msg.content}
                            </div>
                          )}
                          
                          {/* AI Message Actions */}
                          {msg.role === 'ai' && msg.type === 'result' && (
                              <div className="flex items-center gap-3 mt-1 px-1">
                                 <button 
                                    onClick={() => msg.image && handleDownloadClick(msg.image)}
                                    className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white hover:bg-white/5 px-2 py-1 rounded transition-colors group"
                                    title="下载图片"
                                 >
                                    <span className="material-icons text-[14px] group-hover:scale-110 transition-transform">download</span>
                                    下载
                                 </button>
                                 <button
                                    onClick={() => {
                                      setInputText('重新描述：');
                                      document.querySelector<HTMLTextAreaElement>('textarea')?.focus();
                                    }}
                                    className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white hover:bg-white/5 px-2 py-1 rounded transition-colors group"
                                 >
                                    <span className="material-icons text-[14px] group-hover:scale-110 transition-transform">edit</span>
                                    重新描述
                                 </button>
                              </div>
                          )}

                          {/* User Input Image Thumbnail */}
                          {msg.image && msg.role === 'user' && (
                             <div className="relative group mt-1">
                                <img src={msg.image} className="w-28 h-20 object-cover rounded-lg border border-white/10 shadow-lg cursor-pointer hover:opacity-90 transition" alt="reference" />
                             </div>
                          )}
                      </div>
                   </div>
                </div>
             ))}
             
             {status === 'generating' && (
                <div className="flex items-start gap-3">
                   <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                      <span className="material-icons text-xs text-white animate-pulse">smart_toy</span>
                   </div>
                   <div className="bg-[#2C2E33] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-sm text-white/90 font-medium">正在为您生成效果图</span>
                         <div className="flex gap-1 mt-1">
                            <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce delay-150"></span>
                         </div>
                      </div>
                      
                      {/* Queue and Timer Info */}
                      <div className="flex items-center justify-between text-[10px] text-white/50 border-t border-white/5 pt-2 mt-1">
                         <div className="flex items-center gap-1.5">
                            <span className="material-icons text-[12px] text-yellow-500">hourglass_empty</span>
                            <span>排队: <span className="text-white/90 font-mono font-bold">{queueNum}</span> 人</span>
                         </div>
                         <div className="w-px h-3 bg-white/10 mx-2"></div>
                         <div className="flex items-center gap-1.5">
                            <span className="material-icons text-[12px] text-blue-400">timer</span>
                            <span>耗时: <span className="text-white/90 font-mono font-bold">{elapsedTime.toFixed(1)}s</span></span>
                         </div>
                      </div>
                   </div>
                </div>
             )}
          </div>

          <div className="p-4 border-t border-white/10 bg-[#1a1b1e]">
             {/* Text Input */}
             <div className="relative bg-[#0b0c10] rounded-xl border border-white/10 focus-within:border-white/20 transition-colors">
                <textarea 
                   placeholder="输入修改指令，例如：把灯光调暗一点..."
                   className="w-full bg-transparent border-none text-white text-sm px-4 py-3 pr-12 focus:ring-0 resize-none h-12 min-h-[48px] max-h-32 custom-scrollbar placeholder-white/30"
                   rows={1}
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   onKeyDown={handleKeyDown}
                   disabled={status === 'generating'}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || status === 'generating'}
                  className="absolute right-2 top-2 p-1.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                   <span className="material-icons text-sm">send</span>
                </button>
             </div>
             
             {/* Quick Actions */}
             <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => handleQuickAction('更有氛围感')}
                  disabled={status === 'generating'}
                  className="flex-shrink-0 flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5 transition group disabled:opacity-50"
                >
                   <span className="material-icons text-[14px] text-yellow-500 group-hover:text-yellow-400">auto_awesome</span>
                   更有氛围感
                </button>
                <button
                  onClick={() => handleQuickAction('变为夜景')}
                  disabled={status === 'generating'}
                  className="flex-shrink-0 flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5 transition group disabled:opacity-50"
                >
                   <span className="material-icons text-[14px] text-blue-400 group-hover:text-blue-300">dark_mode</span>
                   变为夜景
                </button>
                <button
                  onClick={() => handleQuickAction('鸟瞰视角')}
                  disabled={status === 'generating'}
                  className="flex-shrink-0 flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5 transition group disabled:opacity-50"
                >
                   <span className="material-icons text-[14px] text-green-400 group-hover:text-green-300">landscape</span>
                   鸟瞰视角
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};
