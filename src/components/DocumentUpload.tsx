'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';

interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

interface ProcessingResult {
  rawText: string;
  extractedFields: ExtractedField[];
  processingTime: number;
}

interface ErrorDetails {
  error: string;
  isConfigError: boolean;
  details: string;
  solution?: {
    step1: string;
    step2: string;
    step3: string;
    exampleSchema: any;
  };
  alternativeSolution?: string;
}

export const DocumentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setErrorDetails(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    multiple: false
  });

  const processDocument = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setErrorDetails(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const startTime = Date.now();
      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      });

      const processingTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle schema-related errors specially
        if (errorData.error === 'Custom Extraction Processor Schema Missing') {
          setErrorDetails(errorData);
          throw new Error('Processor configuration required - see details below');
        }
        
        throw new Error(errorData.error || 'Failed to process document');
      }

      const data = await response.json();
      
      setResult({
        rawText: data.text || '',
        extractedFields: data.extractedFields || [],
        processingTime
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the document');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else if (['jpg', 'jpeg', 'png'].includes(extension || '')) {
      return <ImageIcon className="w-8 h-8 text-green-500" />;
    }
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setErrorDetails(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : file
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            {file ? (
              <>
                <div className="flex justify-center">
                  {getFileIcon(file.name)}
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Choose different file
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Drop your document here' : 'Upload a parking citation or document'}
                  </p>
                  <p className="text-gray-500">
                    Drag & drop your file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Supports PDF, JPG, PNG • Max 10MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Process Button */}
        {file && !result && (
          <div className="mt-6 text-center">
            <button
              onClick={processDocument}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Document...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Process Document
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-900 mb-2">Processing Error</h3>
              <p className="text-red-700 mb-3">{error}</p>
              
              {/* Schema Setup Instructions */}
              {errorDetails && errorDetails.solution && (
                <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-red-900 mb-3">🔧 How to Fix This:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-red-800">
                    <li>{errorDetails.solution.step1}</li>
                    <li>{errorDetails.solution.step2}</li>
                    <li>{errorDetails.solution.step3}</li>
                  </ol>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <h5 className="font-medium text-gray-900 mb-2">📄 Use this schema file:</h5>
                    <p className="text-sm text-gray-700 mb-2">
                      Upload <code className="bg-gray-200 px-1 rounded">parking-citation-schema.json</code> from your project root
                    </p>
                  </div>
                  
                  {errorDetails.alternativeSolution && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <h5 className="font-medium text-blue-900 mb-2">💡 Alternative Solution:</h5>
                      <p className="text-sm text-blue-800">{errorDetails.alternativeSolution}</p>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={reset}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-medium text-green-900">
                  Document Processed Successfully
                </h3>
                <p className="text-sm text-green-700">
                  Processing completed in {result.processingTime}ms
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Extracted Fields */}
            {result.extractedFields.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 Extracted Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.extractedFields.map((field, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{field.label}</h5>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {(field.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-gray-700 font-mono text-sm bg-white p-2 rounded">
                        {field.value || 'Not detected'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Text */}
            {result.rawText && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  📄 Raw Extracted Text
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {result.rawText}
                  </pre>
                </div>
              </div>
            )}

            {/* Process Another Button */}
            <div className="mt-6 text-center">
              <button
                onClick={reset}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Process Another Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
