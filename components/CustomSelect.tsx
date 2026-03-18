import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  id: string;
  label: string;
  value?: string;
  badge?: string;
  badgeColor?: string;
  isVip?: boolean;  // 标记是否为 VIP 选项
}

interface CustomSelectProps {
  options: SelectOption[];
  value: SelectOption;
  onChange: (option: SelectOption) => void;
  icon?: string;
  indicatorColor?: string;
  isVip?: boolean;  // 用户是否是 VIP
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  icon, 
  indicatorColor,
  isVip = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showVipTooltip, setShowVipTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowVipTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (option: SelectOption) => {
    // 检查是否是 VIP 选项且用户不是 VIP
    if (option.isVip && !isVip) {
      setShowVipTooltip(true);
      setTimeout(() => setShowVipTooltip(false), 2000);
      return;
    }
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs px-4 py-2 rounded-lg transition border border-white/10 group whitespace-nowrap"
      >
        {icon && <span className={`material-icons text-sm ${value.id.includes('nano') ? 'text-orange-400' : 'text-white/60'}`}>{icon}</span>}
        {indicatorColor && <div className={`w-2 h-2 rounded-full ${indicatorColor}`}></div>}
        
        <span className="text-white/80">
          {value.label}
        </span>
        
        {value.badge && (
          <span className={`${value.badgeColor || 'text-white/60'} text-[9px] border px-1 rounded font-bold border-current opacity-80`}>
            {value.badge}
          </span>
        )}
        
        <span className="material-icons text-sm text-white/40 group-hover:text-white/80 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {/* VIP 提示 Tooltip */}
      {showVipTooltip && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-yellow-500/90 text-black text-xs rounded-lg shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
          ✨ 此功能仅 VIP 用户可用
          <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-yellow-500/90"></div>
        </div>
      )}

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-max min-w-full bg-[#1a1b1e] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {options.map((option) => {
            const isVipOption = option.isVip && !isVip;
            return (
            <button
              key={option.id}
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left px-4 py-2.5 text-xs transition flex items-center gap-2 ${
                  isVipOption 
                    ? 'text-white/30 cursor-not-allowed opacity-60' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span>{option.label}</span>
              {option.badge && (
                  <span className={`${option.badgeColor || 'text-white/60'} text-[9px] border px-1 rounded font-bold border-current opacity-80 scale-90 origin-left flex items-center gap-0.5`}>
                    {option.badge === 'VIP' && <span className="text-[10px]">👑</span>}
                  {option.badge}
                </span>
              )}
                {isVipOption && (
                  <span className="ml-auto text-yellow-400 text-[10px] flex items-center gap-0.5">
                    <span className="material-icons text-xs">lock</span>
                  </span>
                )}
                {value.id === option.id && !isVipOption && (
                <span className="material-icons text-[14px] text-primary ml-auto">check</span>
              )}
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
};