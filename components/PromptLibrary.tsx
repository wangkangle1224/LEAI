import React, { useState } from 'react';
import { SelectOption } from './CustomSelect';
import promptData from '../prompt-data.json';

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: SelectOption, category: string) => void;
}

// 专题分类 - 与 prompt-data.json 中的 key 对应
const CATEGORIES = [
  { id: 'arch', label: '建筑专题' },
  { id: 'interior_light', label: '室内打光' },
  { id: 'interior', label: '室内专题' },
  { id: 'landscape', label: '景观专题' },
  { id: 'analysis', label: '分析图专题' },
];

// 从 prompt-data.json 读取提示词数据
const getPrompts = (): Record<string, { label: string; value: string }[]> => {
  return {
    'arch': promptData.arch || [],
    'interior_light': promptData.interior_light || [],
    'interior': promptData.interior || [],
    'landscape': promptData.landscape || [],
    'analysis': promptData.analysis || [],
  };
};

const PROMPTS = getPrompts();

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ isOpen, onClose, onSelect }) => {
  const [activeCategory, setActiveCategory] = useState('arch');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
       
       <div className="relative w-full max-w-5xl h-[80vh] bg-[#1E2025] rounded-xl shadow-2xl flex overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Sidebar */}
          <div className="w-64 bg-[#2C2E33] flex flex-col border-r border-white/5">
             <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
                {CATEGORIES.map((cat) => (
                   <div 
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-6 py-4 cursor-pointer text-sm font-medium transition-colors relative ${
                         activeCategory === cat.id 
                           ? 'text-white bg-[#3B82F6]/10' 
                           : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                   >
                      {activeCategory === cat.id && (
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                      )}
                      {cat.label}
                   </div>
                ))}
             </div>
             
             {/* Bottom Label */}
             <div className="p-4 border-t border-white/5">
                <button className="flex items-center gap-2 bg-[#3B82F6]/20 text-blue-400 px-4 py-2 rounded-lg w-full justify-center border border-[#3B82F6]/30">
                   <span className="material-icons text-sm">menu_book</span>
                   <span className="text-sm font-bold">提示词库</span>
                </button>
             </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-[#1E2025] flex flex-col">
             {/* Header if needed, or just padding */}
             <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {PROMPTS[activeCategory]?.map((item, index) => (
                      <button
                         key={index}
                         onClick={() => {
                            onSelect({ 
                               id: activeCategory + '_' + index, 
                               label: '模版: ' + item.label, // Update label to show selected
                               value: item.value 
                            }, activeCategory);
                            onClose();
                         }}
                         className="bg-[#2C2E33] hover:bg-[#383A40] border border-white/5 hover:border-white/20 text-white/90 text-sm py-3 px-4 rounded-lg transition-all text-center truncate shadow-sm"
                         title={item.label}
                      >
                         {item.label}
                      </button>
                   ))}
                   {(!PROMPTS[activeCategory] || PROMPTS[activeCategory].length === 0) && (
                       <div className="col-span-full text-center text-white/30 py-10">
                           暂无更多选项
                       </div>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};
