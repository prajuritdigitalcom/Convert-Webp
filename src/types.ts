export type ProcessStatus = 'pending' | 'converting' | 'compressing' | 'success' | 'error';

export interface ProcessedFile {
  id: string;
  name: string;
  outputName: string;
  originalSize: number;
  originalFormat: string;
  originalWidth: number;
  originalHeight: number;
  compressedSize: number | null;
  compressedWidth: number | null;
  compressedHeight: number | null;
  compressedBlob: Blob | null;
  compressedUrl: string | null;
  originalUrl: string;
  status: ProcessStatus;
  progress: number; // 0 to 100
  errorMsg: string | null;
  savingsPercentage: number | null;
  qualityUsed: number | null;
  resizedRatio: number | null;
}

export interface AdminSettings {
  maxOutputSizeKb: number;
  minQuality: number;
  maxUploadSizeMb: number;
  autoResizeEnabled: boolean;
}

export interface AdminStats {
  totalProcessed: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalUsersToday: number;
}
