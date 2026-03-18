export interface GalleryItem {
  id: string;
  title: string;
  image: string;
  prompt: string;
  type: 'info' | 'render' | 'material' | 'site_plan' | 'aerial';
}

export interface GenerationConfig {
  prompt: string;
  image: string | null; // Base64 string
}

export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';
