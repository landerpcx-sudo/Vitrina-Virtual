export type Step = 'capture' | 'customize' | 'results';
export type View = 'user' | 'admin';

export interface Option {
  id: string;
  name: string;
  image?: string;
  description?: string;
  brand?: string;
  tags?: string[];
}

export interface GeneratedImage {
  src: string;
  suggestedSize?: string;
}
