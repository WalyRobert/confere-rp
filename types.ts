
export interface DetectedCode {
  id: string;
  code: string;
  sourceImage: string;
  status: 'pending' | 'found' | 'not_found';
  timestamp: number;
}

export interface ExcelRow {
  [key: string]: any;
}

export interface ProcessingResult {
  totalImages: number;
  totalCodes: number;
  matches: number;
}
