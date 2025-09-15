export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

export interface ProcessingResult {
  success: boolean;
  text: string;
  extractedFields: ExtractedField[];
  processingTime: number;
  error?: string;
  isConfigError?: boolean;
}

export interface DocumentUploadProps {
  onProcessComplete?: (result: ProcessingResult) => void;
  onError?: (error: string) => void;
}

export interface GoogleCloudDocumentAIResponse {
  document?: {
    text?: string;
    entities?: Array<{
      type?: string;
      textAnchor?: {
        content?: string;
      };
      mentionText?: string;
      confidence?: number;
    }>;
  };
}
