import React, { useState, useMemo } from 'react';

interface PromptItem {
  id: string;
  title: string;
  prompt: string;
  category: string;
  icon: string;
  color: string;
  referenceImage?: string;
}

// 提示词数据 - 根据PDF文档整理，添加了参考图片
const PROMPT_DATA: PromptItem[] = [
  // 插画风表现图 - image1, image2
  { 
    id: 'illust-1', 
    title: '插画风渲染效果', 
    category: 'illustration', 
    prompt: '将图像1转化为插画风渲染效果，参照图像2的效果，复刻参考图的风格与场景，同时不改变图像1的模型或角度。风格要求：扁平插画风，主色调为低饱和柔和色系，材质纹理清晰但不破坏插画扁平感。',
    icon: 'brush', 
    color: 'from-pink-500 to-rose-400',
    referenceImage: '/reference-images/image1.jpeg'
  },

  // 清新治愈系扁平插画 - image3, image4, image5, image6
  { 
    id: 'flat-1', 
    title: '清新治愈系扁平插画', 
    category: 'flat-illustration', 
    prompt: '将目标模型图渲染为扁平插画风，1:1复刻参考图的视觉风格与细节。主色调：天空为浅灰蓝渐变，云朵为暖粉棕渐变，建筑为低饱和粉紫色带细密网格肌理，地面为浅米色基底。',
    icon: 'auto_awesome', 
    color: 'from-green-400 to-emerald-400',
    referenceImage: '/reference-images/image3.jpeg'
  },
  { 
    id: 'flat-2', 
    title: '清新拼贴风', 
    category: 'flat-illustration', 
    prompt: '清新治愈系扁平插画，无任何厚重阴影，仅通过色块深浅呈现柔和漫射光的轻量明暗层次。',
    icon: 'style', 
    color: 'from-emerald-400 to-teal-400',
    referenceImage: '/reference-images/image4.jpeg'
  },

  // 纸艺风/拼贴感 - image7, image8
  { 
    id: 'paper-1', 
    title: '纸艺风/拼贴感', 
    category: 'paper-art', 
    prompt: '将图像转化为纸艺风/拼贴感城市插画效果。用明显的层次叠加（建筑、地形、植物都像剪纸一样有厚度）。色调统一用低饱和度、柔和的莫兰迪色系。',
    icon: 'layers', 
    color: 'from-amber-400 to-orange-400',
    referenceImage: '/reference-images/image7.jpeg'
  },

  // 淡韵新中式建筑稿 - image9, image10
  { 
    id: 'chinese-1', 
    title: '新中式轴测鸟瞰', 
    category: 'chinese', 
    prompt: '将图像转化为新中式建筑轴测鸟瞰插画风效果图。视角：微鸟瞰平行投影。风格：极简线稿插画风，用浅蓝+白+深灰蓝的低饱和配色。',
    icon: 'temple_buddhist', 
    color: 'from-red-400 to-pink-400',
    referenceImage: '/reference-images/image9.jpeg'
  },
  { 
    id: 'chinese-2', 
    title: '蓝白线条新中式', 
    category: 'chinese', 
    prompt: '采用蓝白线条+单色渐变的建筑插画风格，无真实材质纹理，用不同明度的蓝色块区分建筑的受光面与背光面。',
    icon: 'water', 
    color: 'from-blue-400 to-indigo-400',
    referenceImage: '/reference-images/image10.jpeg'
  },

  // 精致手工模型风 - image11, image12, image13, image14
  { 
    id: 'model-1', 
    title: '木模型手工效果', 
    category: 'model', 
    prompt: '转化为木模型手工效果图，严格保持原始图的建筑布局。建筑主体使用哑光白卡纸/薄木板拼接质感，玻璃部分为半透明白色硫酸纸。',
    icon: 'view_in_ar', 
    color: 'from-blue-400 to-indigo-400',
    referenceImage: '/reference-images/image11.jpeg'
  },
  { 
    id: 'model-2', 
    title: '白膜手工效果', 
    category: 'model', 
    prompt: '转化为白膜手工效果图。整体为全白色调，高层部分为哑光白ABS板质感，玻璃区域为半透明白色亚克力质感。',
    icon: 'cube', 
    color: 'from-gray-300 to-slate-400',
    referenceImage: '/reference-images/image12.jpeg'
  },
  { 
    id: 'model-3', 
    title: '精致暖光手工模型', 
    category: 'model', 
    prompt: '转化为精致暖光手工模型风效果图。建筑主体：哑光白色树脂材质+半透玻璃（内部透出暖黄灯光）+局部浅木色装饰格栅。',
    icon: 'lightbulb', 
    color: 'from-yellow-400 to-amber-400',
    referenceImage: '/reference-images/image13.jpeg'
  },

  // 蓝白扁平风 - image15
  { 
    id: 'bluewhite-1', 
    title: '轻手绘线稿+扁平化', 
    category: 'blue-white', 
    prompt: '将图像转化为轻手绘线稿+扁平化色块结合的插画式建筑/城市设计风效果。用柔和的手绘感线条勾勒空间轮廓。',
    icon: 'palette', 
    color: 'from-cyan-400 to-blue-400',
    referenceImage: '/reference-images/image15.jpeg'
  },

  // 复古色调效果 - image16
  { 
    id: 'retro-1', 
    title: '低饱和复古色调', 
    category: 'retro', 
    prompt: '将图像转化为低饱和度的复古色调效果。用低饱和度的复古色调（偏灰调的暖棕、浅蓝、淡橙），整体带轻微颗粒感。',
    icon: 'vintage', 
    color: 'from-orange-400 to-amber-400',
    referenceImage: '/reference-images/image16.jpeg'
  },

  // 沙盘风格效果 - image17
  { 
    id: 'sand-1', 
    title: '国风纸艺层叠雪景', 
    category: 'sand table', 
    prompt: '将图像转化为国风纸艺层叠+雪景古建效果。色彩体系：浅米白（纸基底）、浅木色（建筑主体）、浅青蓝（水体）为主。',
    icon: 'map', 
    color: 'from-slate-400 to-zinc-400',
    referenceImage: '/reference-images/image17.jpeg'
  },

  // 低调黑金风 - image18
  { 
    id: 'blackgold-1', 
    title: '黑金夜景效果', 
    category: 'black-gold', 
    prompt: '将图像转化为黑金夜景效果。环境：雨天城市街道，路面潮湿且带有清晰反光。核心元素：黄色出租车、现代流线型玻璃幕墙建筑。',
    icon: 'nightlight', 
    color: 'from-yellow-600 to-amber-600',
    referenceImage: '/reference-images/image18.jpeg'
  },

  // 治愈扁平风 - image19
  { 
    id: 'healing-1', 
    title: '粉蓝柔和撞色', 
    category: 'healing-flat', 
    prompt: '将图像转化为治愈扁平风效果。色调：粉（暖调淡粉）+蓝（冷调浅蓝/灰蓝）的柔和撞色，整体饱和度偏低。',
    icon: 'favorite', 
    color: 'from-pink-400 to-rose-400',
    referenceImage: '/reference-images/image19.jpeg'
  },

  // 赛博朋克风 - image20
  { 
    id: 'cyber-1', 
    title: '赛博朋克渲染', 
    category: 'cyberpunk', 
    prompt: '将图像转化为详尽的赛博朋克风格渲染效果。氛围：雨夜设定，湿润反光的地面，霓虹灯光在路面形成倒影。',
    icon: 'smart_toy', 
    color: 'from-purple-500 to-indigo-500',
    referenceImage: '/reference-images/image20.jpeg'
  },

  // 日式治愈系插画 - image21
  { 
    id: 'japanese-1', 
    title: '日式治愈柔焦', 
    category: 'japanese', 
    prompt: '将图像转化为春日城市公共空间插画效果。核心风格：莫兰迪色系淡彩手绘插画，日式治愈柔焦质感。',
    icon: 'local_florist', 
    color: 'from-pink-300 to-rose-300',
    referenceImage: '/reference-images/image21.jpeg'
  },

  // 日式漫画风 - image22
  { 
    id: 'japcomic-1', 
    title: '黑白日式漫画', 
    category: 'japanese-comic', 
    prompt: '将图像转换为黑白日式漫画（赛博朋克城市插画）风格。采用日式漫画的利落实线轮廓线；用不同密度的网点纸表现层次。',
    icon: 'comic', 
    color: 'from-gray-600 to-gray-800',
    referenceImage: '/reference-images/image22.jpeg'
  },

  // 台湾老街区插画 - image23
  { 
    id: 'taiwan-1', 
    title: '台湾老街区风格', 
    category: 'taiwan', 
    prompt: '将图像转换为清新治愈插画风格。核心风格：清新治愈的台湾老街区插画风格，平涂结合轻质感表现。',
    icon: 'storefront', 
    color: 'from-teal-400 to-green-400',
    referenceImage: '/reference-images/image23.jpeg'
  },

  // 国潮插画风格 - image24, image25, image26
  { 
    id: 'guochao-1', 
    title: '国潮扁平插画', 
    category: 'guochao', 
    prompt: '把建筑转换成新中式插画的风格。建筑元素：保留原建筑的空间布局，将材质换成扁平化色块+细线条勾边。',
    icon: 'style', 
    color: 'from-red-500 to-orange-500',
    referenceImage: '/reference-images/image24.jpeg'
  },
  { 
    id: 'guochao-2', 
    title: '国潮分析图', 
    category: 'guochao', 
    prompt: '将3D渲染图完全转换成干净、平涂的矢量插画。采用柔和、低饱和度配色，用深绿色细线条勾勒建筑边缘轮廓。',
    icon: 'analytics', 
    color: 'from-orange-500 to-red-500',
    referenceImage: '/reference-images/image25.jpeg'
  },

  // 波普艺术风格 - image27
  { 
    id: 'pop-1', 
    title: '波普艺术+孟菲斯', 
    category: 'pop-art', 
    prompt: '严格锁定视角，完全套用波普艺术+孟菲斯设计视觉风格。主色调：鲜明橙色、钴蓝色、明黄色。',
    icon: 'star', 
    color: 'from-yellow-400 to-orange-400',
    referenceImage: '/reference-images/image27.jpeg'
  },

  // 暖系工业风格 - image28
  { 
    id: 'industrial-1', 
    title: '暖系工业风街区', 
    category: 'industrial', 
    prompt: '将工业风街区转化为拼贴插画风格效果图。整体采用低饱和大地色系，以砖红、米白、深灰、暖棕为核心色调。',
    icon: 'factory', 
    color: 'from-amber-600 to-red-500',
    referenceImage: '/reference-images/image28.jpeg'
  },

  // 四季拼贴风格 - image29, image30, image31, image32
  { 
    id: 'seasons-1', 
    title: '春季新中式', 
    category: 'four-seasons', 
    prompt: '以新中式街巷建筑集群为参考，矢量拼贴风格。春季专属：深绿色瓦片屋顶、木框白墙的传统中式民居，浅绿草地。',
    icon: 'calendar_today', 
    color: 'from-green-500 to-teal-500',
    referenceImage: '/reference-images/image29.jpeg'
  },
  { 
    id: 'seasons-2', 
    title: '夏季滨水建筑', 
    category: 'four-seasons', 
    prompt: '以新中式滨水建筑集群为参考。夏季：深灰色瓦片屋顶、湖蓝色蜿蜒水面、橙色曲线空中步道。',
    icon: 'water_drop', 
    color: 'from-blue-500 to-cyan-400',
    referenceImage: '/reference-images/image30.jpeg'
  },
  { 
    id: 'seasons-3', 
    title: '秋季街巷建筑', 
    category: 'four-seasons', 
    prompt: '以新中式街巷建筑集群为参考。秋季：深棕色瓦片屋顶、浅蓝带橙渐变的水面、枯枝干带稀疏橙黄叶。',
    icon: 'eco', 
    color: 'from-orange-400 to-amber-400',
    referenceImage: '/reference-images/image31.jpeg'
  },
  { 
    id: 'seasons-4', 
    title: '冬季合院建筑', 
    category: 'four-seasons', 
    prompt: '以新中式合院建筑集群为参考。冬季：深灰色瓦片带积雪边缘、带红色梅花的枯枝干、飘落的白色雪花。',
    icon: 'ac_unit', 
    color: 'from-slate-300 to-blue-400',
    referenceImage: '/reference-images/image32.jpeg'
  },

  // 国风烟火夜景 - image33
  { 
    id: 'fireworks-1', 
    title: '赛博国风夜景', 
    category: 'fireworks', 
    prompt: '将建筑模型转换为赛博国风夜景插画风格。核心氛围：灯火通明、烟火漫天、喜气祥和。',
    icon: 'celebration', 
    color: 'from-red-600 to-pink-500',
    referenceImage: '/reference-images/image33.jpeg'
  },

  // 复古未来主义 - image34
  { 
    id: 'retrofuturism-1', 
    title: '复古未来主义建筑', 
    category: 'retro-futurism', 
    prompt: '完全参考复古未来主义建筑插画风格，采用混合媒介拼贴质感，所有元素保留手绘肌理与70年代复古印刷颗粒感。',
    icon: 'rocket_launch', 
    color: 'from-amber-500 to-yellow-400',
    referenceImage: '/reference-images/image34.jpeg'
  },

  // 插画风建筑平面图 - image35, image36
  { 
    id: 'floorplan-1', 
    title: '手绘质感平面图', 
    category: 'floor-plan', 
    prompt: '优化建筑效果，复刻参考图的全部元素。视觉风格：手绘质感，线条为手绘感非生硬矢量线。色彩系统：米白/浅灰底色。',
    icon: 'floorplan', 
    color: 'from-blue-500 to-cyan-400',
    referenceImage: '/reference-images/image35.jpeg'
  },

  // 森林氛围感 - image37
  { 
    id: 'forest-1', 
    title: '森林系建筑表现', 
    category: 'forest', 
    prompt: '将建筑完全转换为森林系建筑表现风格。场景：将建筑置于茂密浅绿针叶林环境中，高大树木环绕建筑。',
    icon: 'forest', 
    color: 'from-green-600 to-emerald-600',
    referenceImage: '/reference-images/image37.jpeg'
  },

  // 复古拼贴插画 - image38
  { 
    id: 'collage-1', 
    title: '复古拼贴插画', 
    category: 'collage', 
    prompt: '将现代坡顶建筑方案1:1复刻参考图的复古拼贴插画风格。色彩：暖黄色（赭石色）网格底纹。',
    icon: 'collage', 
    color: 'from-yellow-600 to-orange-600',
    referenceImage: '/reference-images/image38.jpeg'
  },

  // 写实渲染风格 - image39, image40, image41, image42, image43, image44
  { 
    id: 'render-1', 
    title: 'MIR风格', 
    category: 'rendering', 
    prompt: 'MIR-style architectural visualization, soft overcast lighting, poetic atmosphere, human-scale narrative. 适用：竞赛方案/公建/文化建筑。',
    icon: 'photo_camera', 
    color: 'from-blue-600 to-indigo-600',
    referenceImage: '/reference-images/image39.jpeg'
  },
  { 
    id: 'render-2', 
    title: 'Luxigon风格', 
    category: 'rendering', 
    prompt: 'Luxigon-style rendering, natural color palette, refined composition, realistic but understated. 适用：高端商业/城市综合体。',
    icon: 'business', 
    color: 'from-indigo-500 to-purple-500',
    referenceImage: '/reference-images/image40.jpeg'
  },
  { 
    id: 'render-3', 
    title: 'Brick Visual风格', 
    category: 'rendering', 
    prompt: 'Brick Visual style, cinematic wide-angle, dramatic sky, highly realistic materials. 适用：商业综合体/地标项目。',
    icon: 'apartment', 
    color: 'from-purple-500 to-pink-500',
    referenceImage: '/reference-images/image41.jpeg'
  },
  { 
    id: 'render-4', 
    title: 'DBox风格', 
    category: 'rendering', 
    prompt: 'DBOX-style visualization, cinematic sunset lighting, luxury lifestyle atmosphere. 适用：地产广告。',
    icon: 'home', 
    color: 'from-orange-500 to-red-500',
    referenceImage: '/reference-images/image42.jpeg'
  },
  { 
    id: 'render-5', 
    title: 'XOIO风格', 
    category: 'rendering', 
    prompt: 'XOIO-style rendering, warm soft lighting, natural material texture, serene classical atmosphere. 适用：高端住宅/文化建筑。',
    icon: 'nature_people', 
    color: 'from-amber-500 to-yellow-500',
    referenceImage: '/reference-images/image43.jpeg'
  },
  { 
    id: 'render-6', 
    title: 'Plomp风格', 
    category: 'rendering', 
    prompt: 'Plomp-style architectural rendering, clean composition, modern minimal aesthetic. 适用：亚洲竞赛向。',
    icon: 'minimalist', 
    color: 'from-slate-500 to-zinc-500',
    referenceImage: '/reference-images/image44.png'
  },
];

interface PromptReferenceProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
}

export const PromptReference: React.FC<PromptReferenceProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imgError, setImgError] = useState<Set<string>>(new Set());
  const [expandedItem, setExpandedItem] = useState<PromptItem | null>(null);

  // 过滤提示词
  const filteredPrompts = useMemo(() => {
    if (!searchKeyword) {
      return PROMPT_DATA;
    }
    const keyword = searchKeyword.toLowerCase();
    return PROMPT_DATA.filter(item =>
      item.title.toLowerCase().includes(keyword) ||
      item.prompt.toLowerCase().includes(keyword)
    );
  }, [searchKeyword]);

  // 复制提示词
  const handleCopy = (item: PromptItem) => {
    navigator.clipboard.writeText(item.prompt);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 使用提示词
  const handleUse = (item: PromptItem) => {
    onSelect(item.prompt);
    onClose();
  };

  // 点击卡片展开详情
  const handleCardClick = (item: PromptItem) => {
    setExpandedItem(item);
  };

  // 图片加载失败处理
  const handleImgError = (id: string) => {
    setImgError(prev => new Set(prev).add(id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* 主内容区域 */}
      <div className="relative w-full max-w-[1800px] mx-auto my-4 ml-4 mr-4 md:ml-8 md:mr-8 lg:ml-12 lg:mr-12 h-[calc(100vh-2rem)] flex flex-col bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* 顶部标题和搜索栏 */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <span className="material-icons text-primary text-xl">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                提示词参考
              </h3>
              <p className="text-white/40 text-xs">点击卡片直接使用提示词</p>
            </div>
          </div>
          <div className="relative flex items-center gap-3 flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-white/40 text-lg">search</span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索提示词..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/40 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
            />
            {searchKeyword && (
              <span className="text-white/40 text-xs whitespace-nowrap">
                共 {filteredPrompts.length} 个
              </span>
            )}
          </div>
        </div>

        {/* 提示词列表 - 全宽瀑布流布局 */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredPrompts.map(item => (
              <div
                key={item.id}
                className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 hover:bg-white/10 transition-all cursor-pointer flex flex-col"
                onClick={() => handleCardClick(item)}
              >
                {/* 参考图片 */}
                <div className="aspect-[4/3] relative overflow-hidden bg-black/20">
                  {item.referenceImage && !imgError.has(item.id) ? (
                    <img
                      src={item.referenceImage}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => handleImgError(item.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-icons text-white/20 text-4xl">image</span>
                    </div>
                  )}
                </div>

                {/* 标题 */}
                <div className="px-3 pt-3">
                  <h4 className="text-white text-sm font-medium flex items-center gap-2">
                    <span className={`w-5 h-5 rounded bg-gradient-to-r ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="material-icons text-white text-[10px]">{item.icon}</span>
                    </span>
                    <span className="truncate">{item.title}</span>
                  </h4>
                </div>

                {/* 提示词内容 */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <p className="text-white/50 text-xs line-clamp-3">{item.prompt}</p>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 hover:text-white text-xs transition-colors"
                    >
                      <span className="material-icons text-xs">
                        {copiedId === item.id ? 'check' : 'content_copy'}
                      </span>
                      {copiedId === item.id ? '已复制' : '复制'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUse(item);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-medium transition-colors"
                    >
                      <span className="material-icons text-xs">east</span>
                      使用
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 空状态 */}
          {filteredPrompts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-icons text-white/20 text-6xl mb-4">search_off</span>
              <p className="text-white/40 text-sm">没有找到匹配的提示词</p>
            </div>
          )}
        </div>

        {/* 底部统计 */}
        <div className="p-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
          <span className="text-white/30 text-xs">
            共 {PROMPT_DATA.length} 个提示词模板
          </span>
          <span className="text-white/30 text-xs flex items-center gap-1">
            <span className="material-icons text-xs">touch_app</span>
            点击卡片直接使用提示词
          </span>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10"
        >
          <span className="material-icons text-sm">close</span>
        </button>

        {/* 展开详情弹窗 */}
        {expandedItem && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 md:p-8">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setExpandedItem(null)}
            ></div>
            <div className="relative w-full max-w-4xl max-h-full bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* 顶部标题栏 */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg bg-gradient-to-r ${expandedItem.color} flex items-center justify-center`}>
                    <span className="material-icons text-white text-sm">{expandedItem.icon}</span>
                  </span>
                  <h3 className="text-white font-bold text-lg">{expandedItem.title}</h3>
                </div>
                <button
                  onClick={() => setExpandedItem(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <span className="material-icons text-sm">close</span>
                </button>
              </div>

              {/* 内容区域 */}
              <div className="flex flex-col md:flex-row max-h-[calc(100vh-200px)] overflow-hidden">
                {/* 左侧图片 */}
                <div className="md:w-1/2 bg-black/20 flex items-center justify-center p-4 overflow-hidden">
                  {expandedItem.referenceImage && !imgError.has(expandedItem.id) ? (
                    <img
                      src={expandedItem.referenceImage}
                      alt={expandedItem.title}
                      className="max-w-full max-h-[400px] md:max-h-[500px] object-contain rounded-lg"
                      onError={() => handleImgError(expandedItem.id)}
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center">
                      <span className="material-icons text-white/20 text-6xl">image</span>
                    </div>
                  )}
                </div>

                {/* 右侧提示词 */}
                <div className="md:w-1/2 p-5 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons text-primary text-lg">description</span>
                    <span className="text-white/80 text-sm font-medium">提示词内容</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                        {expandedItem.prompt}
                      </p>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleCopy(expandedItem)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 hover:text-white text-sm font-medium transition-all"
                    >
                      <span className="material-icons text-base">
                        {copiedId === expandedItem.id ? 'check' : 'content_copy'}
                      </span>
                      {copiedId === expandedItem.id ? '已复制' : '复制提示词'}
                    </button>
                    <button
                      onClick={() => handleUse(expandedItem)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-primary/20"
                    >
                      <span className="material-icons text-base">east</span>
                      使用此提示词
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
