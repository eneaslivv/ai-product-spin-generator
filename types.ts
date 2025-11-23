
export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ENHANCING = 'ENHANCING',
  GENERATING_SPIN = 'GENERATING_SPIN',
  SAVING = 'SAVING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface ProductData {
  id: string;
  name: string;
  originalImageBlob: Blob | null;
  originalBackImageBlob: Blob | null;
  originalImageUrl: string | null;
  enhancedImageUrl: string | null;
  enhancedBackImageUrl: string | null;
  videoUrl: string | null;
  timestamp: number;
}

export interface ApiKeys {
  googleApiKey: string;
  falKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error';
}

export interface FalResponse {
  video?: {
    url: string;
  };
}
