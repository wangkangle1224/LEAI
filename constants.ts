import { GalleryItem } from "./types";
import { SelectOption } from "./components/CustomSelect";

export const DEFAULT_PROMPT = "请将此总平面图转化为一张专业级别的彩色总平面图。在保留原有线条轮廓与细节的基础上，将屋顶设为黄色，道路为浅灰色，河流为蓝色，并点缀浅绿色的树木植物，其他物体颜色可以鲜艳一点，使得画面色彩丰富。为整个画面添加柔和的投影，最终效果应如同专业设计公司出品。";

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "1",
    title: "建筑分析图",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6VC9qV2D0FapA7Wlnql1UjTBk4eiIDvTfChzM7XWSGnxEzfHc9WOSptqYV7QSc2a-kutlVJIFUrXkors0BUoICNz652RNmRBA26aGUBIgRz9pmQB4Qb5VJzWCDZqpWSwJ4XRh3GT_BohON-46ArZ3Jr7S07ov-fcC0N1mSt6UVyZWR1rvIPfUDQWKmFndu-YY4YQJ4tPyqw9ZWpfKulvStUTg9jZdD2pV34JwnExxq4hmtSmNG8XjWKYzrMnW_z1Eq1qQqGBebHQ",
    type: "info",
    prompt: "Generate a minimalist architectural information diagram with clear zoning and axonometric view."
  },
  {
    id: "2",
    title: "建筑展板设计",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBG_lDBPgT9UZiEI4Wl9d0cML5cSSZOJ3yNRw5lbzMzE2CoZTaUz1AZQS9aC4faHdrI6U3pqxeaTl-VA2Itzu9cL3Lz2kZgYzedm2MgWDiyj6kYPRB4iR6npQB4ARTnsocZfJr0KcwAVMGEYjX2DU84iAuJIXFVc25V7X7fpOkZly4z1QI97TQqeltYbhdrPrqA0c8JsCd1vToAlHztYhQ93iGKdKM8oq5CrhE6zPy8M2WyeOC7g-y--pcIAibqdOqLU1mztD_J2YA",
    type: "render",
    prompt: "Transform into a high-quality exhibition panel featuring a traditional Chinese pagoda with dramatic lighting."
  },
  {
    id: "3",
    title: "建筑材质替换",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAt_5eC2KUrPl7j4NkbIl28xHxpA75AyOXmDTMemT4hvrn42RaxtUaFWnURhxivphK8yglgzi3nXgA3MF8U2Z6wJG6b_Fux6epZVwBNGlriPjHiE0I5LG7ZDAzUm9jDkx1UbrYKNnWFLQTknaUZJP-eiMdJp3udQUFzeF4Sf4alxtrNKRLHkShYl7Jy6qAO1aeCW7jXPtNgdKIm2fAq43UOChxANoQkJaud5PZNGj4a2mXxhYBNj_utqQGcDeF10Pa1NSGmZLbzv7o",
    type: "material",
    prompt: "Change the material to exposed fair-faced concrete with realistic texture and lighting."
  },
  {
    id: "4",
    title: "总平图填色",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_bmLGKYWSO9WPl1h3qF4cVphodT7MILH2cWBbjiohUSZPVzJPplRY6zEDxCqbTNYCWaO9TzEQoDNp1tzAAtLVTT5yEa9fVUKej0Isew2es36zfQUVjZCyinFi4j9qFNJGg0NZNpRPDgygBevTRyebL1L_kvzO6nZgtxgVD075LFJfiNwwJxpSXQY5_ojHeysd6Yc7o1qTWKZm8GXd6Mmfo2mYOkEMLp-pw9wlkDy63B4P5azyG2yPRJBXfjCTNSyOSoSi2bneq3k",
    type: "site_plan",
    prompt: DEFAULT_PROMPT
  },
  {
    id: "5",
    title: "总平图转鸟瞰",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIFfdxXObJobT09y7-Ul7KPIJhJZZ6ozju1akVdnxYibY-2nLzuEBguYAPzrdap-zamQrhmACvPhhjQQDllUBgHebIlztwU8xRgx1SNDVzsTW1f29i7MX09bjK41U_8v2AMbRwqiMdgN2H5gA2F_QmBHK407a1pOaBES5cZkgkP6ghyaKe74eTH71k4bTC-H6DPSaRa36t1cIP8er5tlqYZZfrzwUAEDVnZbJf-kwehOtM8DLimPjpsTHzQHGxT1OuHvz2ERu2WP8",
    type: "aerial",
    prompt: "Convert this site plan into a photorealistic aerial bird's eye view render of the campus."
  }
];

export const PLACEHOLDER_INPUT_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuAhADhNvrXskpBz1F1ubNQSl15VtWPGUCtz5IyiwG4V1kwoFCsMT_3sNI06r3uVwTezTMh0fmlx3taPKDM9OJmCOu816u0q8FSLbOesBxFXx_O9Av_bUZ5dGgLj3FcUrVrqBGcoaQAOaWAjaQC7SYqA8cZm2p6gyAwgqG1zOAKUv6zxmL-an_QUWiWMbPG59FkV17xQrg4TXii7Trj2U4bb5IYi8e5EZ4JgAGumGqdUKQnHw3KSs4nLNxbwKRgHQgXOD_zlQJZuRrc";

export const MODEL_OPTIONS: SelectOption[] = [
  { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 图片生成', badge: '推荐', badgeColor: 'text-blue-400 border-blue-400/40' },
  { id: 'nano-banana', label: 'Nano Banana(线路一)', badge: 'FAST', badgeColor: 'text-green-400 border-green-400/40' },
  { id: 'nano-banana-pro', label: 'Nano Banana Pro(高清)', badge: 'HD', badgeColor: 'text-purple-400 border-purple-400/40' },
];

export const TEMPLATE_OPTIONS: SelectOption[] = [
  { id: 'none', label: '模版: 无', value: '' },
  { id: 'modern', label: '模版: 现代极简', value: ', modern minimalist architectural style, clean lines, glass, concrete, cinematic lighting' },
  { id: 'chinese', label: '模版: 中式传统', value: ', traditional chinese architectural style, wooden structures, pagoda, atmospheric lighting' },
  { id: 'cyberpunk', label: '模版: 赛博朋克', value: ', cyberpunk style, neon lights, futuristic architecture, night scene, rainy' },
  { id: 'sketch', label: '模版: 手绘草图', value: ', architectural sketch style, pencil drawing, loose lines, artistic' },
];

export const RESOLUTION_OPTIONS: SelectOption[] = [
  { id: '1K', label: '智能 | 标准 1K' },
  { id: '2K', label: '高清 | 2K' },
  { id: '4K', label: '超清 | 4K', badge: 'VIP', badgeColor: 'text-yellow-400 border-yellow-400/40' },
];

// 尺寸比例选项
export const ASPECT_RATIO_OPTIONS: SelectOption[] = [
  { id: '1:1', label: '1:1 方形', value: '--ar 1:1' },
  { id: '16:9', label: '16:9 宽屏', value: '--ar 16:9' },
  { id: '4:3', label: '4:3 标准', value: '--ar 4:3' },
  { id: '9:16', label: '9:16 竖屏', value: '--ar 9:16' },
  { id: '3:2', label: '3:2 摄影', value: '--ar 3:2' },
  { id: '21:9', label: '21:9 电影', value: '--ar 21:9' },
];

// 详细尺寸选项（像素）
export const SIZE_OPTIONS: SelectOption[] = [
  { id: '1024x1024', label: '1024×1024', value: '--width 1024 --height 1024' },
  { id: '1920x1080', label: '1920×1080', value: '--width 1920 --height 1080' },
  { id: '1280x720', label: '1280×720', value: '--width 1280 --height 720' },
  { id: '3840x2160', label: '3840×2160 (4K)', value: '--width 3840 --height 2160', isVip: true },
];