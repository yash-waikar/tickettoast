"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  Globe,
} from "lucide-react";
import { MultiStepLoader } from "./ui/multi-step-loader";
import { FileUpload } from "./ui/file-upload";
import { GlowingEffect } from "./ui/glowing-effect";

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

const loadingStates = [
  { text: "Uploading document to server..." },
  { text: "Authenticating with Google Cloud..." },
  { text: "Initializing Document AI processor..." },
  { text: "Analyzing document structure..." },
  { text: "Extracting text content..." },
  { text: "Identifying parking citation fields..." },
  { text: "Processing structured data..." },
  { text: "Processing complete!" },
];

export const DocumentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [isFillingForm, setIsFillingForm] = useState(false);
  const [formFillResult, setFormFillResult] = useState<any>(null);
  const [customFormUrl, setCustomFormUrl] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const formOptions = [
    {
      name: "Parking Ticket Appeal Form",
      url: "https://portal.laserfiche.com/h4073/forms/ParkingTicketAppeal",
      description: "Official parking citation appeal form",
    },
    {
      name: "Custom Form URL",
      url: "custom",
      description: "Enter your own form URL",
    },
  ];

  const handleFileChange = useCallback((files: File[]) => {
    const selectedFile = files[0];
    if (selectedFile) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Invalid file type. Please upload a PDF, JPG, or PNG file.");
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File too large. Please upload a file smaller than 10MB.");
        return;
      }

      setFile(selectedFile);
      setResult(null);
      setError(null);
      setErrorDetails(null);
    }
  }, []);

  const processDocument = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setErrorDetails(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const startTime = Date.now();
      const response = await fetch("/api/process-document", {
        method: "POST",
        body: formData,
      });

      const processingTime = Date.now() - startTime;

      if (!response.ok) {
        let errorData;
        let errorMessage = "Failed to process document";
        
        try {
          const responseText = await response.text();
          
          // Try to parse as JSON first
          try {
            errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
            
            if (errorData.error === "Custom Extraction Processor Schema Missing") {
              setErrorDetails(errorData);
              throw new Error(
                "Processor configuration required - see details below"
              );
            }
          } catch (jsonError) {
            // If not JSON, treat as plain text error
            errorMessage = responseText || `Server error (${response.status})`;
          }
        } catch (textError) {
          errorMessage = `Server error (${response.status}: ${response.statusText})`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      setResult({
        rawText: data.text || "",
        extractedFields: data.extractedFields || [],
        processingTime,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while processing the document"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "pdf") {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else if (["jpg", "jpeg", "png"].includes(extension || "")) {
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
    setIsFillingForm(false);
    setFormFillResult(null);
    setCustomFormUrl("");
    setShowUrlInput(false);
  };

  const fillForm = async (previewMode: boolean = true, formUrl?: string) => {
    if (!result || !result.extractedFields) return;
    let targetUrl = formUrl;
    if (!targetUrl) {
      if (showUrlInput && customFormUrl) {
        targetUrl = customFormUrl;
      } else {
        targetUrl = formOptions[0].url;
      }
    }

    setIsFillingForm(true);
    setFormFillResult(null);

    try {
      const response = await fetch("/api/fill-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extractedFields: result.extractedFields,
          previewMode,
          formUrl: targetUrl,
        }),
      });

      if (!response.ok) {
        let errorData;
        let errorMessage = "Failed to fill form";
        
        try {
          const responseText = await response.text();
          
          // Try to parse as JSON first
          try {
            errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
            
            if (errorData.isSetupError) {
              throw new Error(`Setup Required: ${errorData.details}`);
            }
          } catch (jsonError) {
            // If not JSON, treat as plain text error
            errorMessage = responseText || `Server error (${response.status})`;
          }
        } catch (textError) {
          errorMessage = `Server error (${response.status}: ${response.statusText})`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setFormFillResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while filling the form"
      );
    } finally {
      setIsFillingForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={isProcessing}
        duration={1000}
        loop={false}
      />

      <div className="relative glass-card glass-hover rounded-xl p-8">
        <GlowingEffect
          disabled={false}
          proximity={100}
          spread={30}
          blur={2}
          borderWidth={2}
          movementDuration={1.5}
          inactiveZone={0.5}
          className="opacity-60"
        />
        {!file ? (
          <FileUpload onChange={handleFileChange} />
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center">{getFileIcon(file.name)}</div>
            <div>
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-600 mt-1">{file.type}</p>
            </div>
            <button
              onClick={reset}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Choose different file
            </button>
          </div>
        )}

        {file && !result && (
          <div className="mt-6 text-center">
            <button
              onClick={processDocument}
              disabled={isProcessing}
              className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 mx-auto min-w-[200px]"
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-medium text-white backdrop-blur-3xl gap-2 whitespace-nowrap">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 flex-shrink-0" />
                    <span>Process Document</span>
                  </>
                )}
              </span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-900 mb-2">
                Processing Error
              </h3>
              <p className="text-red-700 mb-3">{error}</p>

              {errorDetails && errorDetails.solution && (
                <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-red-900 mb-3">
                    How to Fix This:
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-red-800">
                    <li>{errorDetails.solution.step1}</li>
                    <li>{errorDetails.solution.step2}</li>
                    <li>{errorDetails.solution.step3}</li>
                  </ol>

                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Use this schema file:
                    </h5>
                    <p className="text-sm text-gray-700 mb-2">
                      Upload{" "}
                      <code className="bg-gray-200 px-1 rounded">
                        parking-citation-schema.json
                      </code>{" "}
                      from your project root
                    </p>
                  </div>

                  {errorDetails.alternativeSolution && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <h5 className="font-medium text-blue-900 mb-2">
                        Alternative Solution:
                      </h5>
                      <p className="text-sm text-blue-800">
                        {errorDetails.alternativeSolution}
                      </p>
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

      {result && (
        <div className="w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
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

          <div className="p-6 flex flex-col xl:flex-row gap-6">
            {/* Left Side - Extracted Data */}
            <div className="flex-1 space-y-6">
              {result.extractedFields.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Extracted Information
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {result.extractedFields.map((field, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">
                            {field.label}
                          </h5>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {(field.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-gray-700 font-mono text-sm bg-white p-2 rounded">
                          {field.value || "Not detected"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.rawText && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Raw Extracted Text
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {result.rawText}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Form Selection & Actions */}
            <div className="xl:w-96 space-y-6">
              {/* Form URL Selection */}
              <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    Choose Form to Auto-Fill
                  </h4>
                </div>
                <div className="space-y-3">
                  {formOptions.map((option, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id={`form-option-${index}`}
                        name="form-selection"
                        value={option.url}
                        checked={
                          option.url === "custom"
                            ? showUrlInput
                            : !showUrlInput && index === 0
                        }
                        onChange={(e) => {
                          if (option.url === "custom") {
                            setShowUrlInput(true);
                          } else {
                            setShowUrlInput(false);
                            setCustomFormUrl("");
                          }
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`form-option-${index}`}
                          className="block text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {option.name}
                        </label>
                        <p className="text-sm text-gray-500">
                          {option.description}
                        </p>
                        {option.url !== "custom" && (
                          <p className="text-xs text-blue-600 font-mono mt-1 break-all">
                            {option.url}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom URL Input */}
                {showUrlInput && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label
                      htmlFor="custom-url"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Enter Form URL
                    </label>
                    <input
                      type="url"
                      id="custom-url"
                      value={customFormUrl}
                      onChange={(e) => setCustomFormUrl(e.target.value)}
                      placeholder="https://example.com/your-form"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the URL of the form you want to auto-fill with the
                      extracted data
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const selectedUrl = showUrlInput
                      ? customFormUrl
                      : formOptions[0].url;
                    fillForm(true, selectedUrl);
                  }}
                  disabled={
                    isFillingForm || (showUrlInput && !customFormUrl.trim())
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 justify-center"
                >
                  {isFillingForm ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Filling Form...
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      Preview Form Fill
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    const selectedUrl = showUrlInput
                      ? customFormUrl
                      : formOptions[0].url;
                    fillForm(false, selectedUrl);
                  }}
                  disabled={
                    isFillingForm || (showUrlInput && !customFormUrl.trim())
                  }
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 justify-center"
                >
                  <ExternalLink className="w-5 h-5" />
                  Fill Form (Silent)
                </button>

                <button
                  onClick={reset}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Process Another Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Fill Results */}
      {formFillResult && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="bg-blue-500/10 backdrop-blur-sm border-b border-blue-500/20 p-6">
            <div className="flex items-center gap-3">
              <ExternalLink className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-100">
                  Form Fill Results
                </h3>
                <p className="text-sm text-blue-300">
                  {formFillResult.success
                    ? "Successfully filled form fields"
                    : "Form fill completed with errors"}
                </p>
                {formFillResult.formUrl && (
                  <p className="text-xs text-blue-400 font-mono mt-1 break-all">
                    📍 {formFillResult.formUrl}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Filled Fields */}
            {formFillResult.filledFields &&
              formFillResult.filledFields.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-100 mb-4">
                    Filled Fields
                  </h4>
                  <div className="space-y-3">
                    {formFillResult.filledFields.map(
                      (field: any, index: number) => (
                        <div
                          key={index}
                          className={`bg-white/10 backdrop-blur-sm rounded-lg p-3 border-l-4 ${
                            field.success
                              ? "border-green-400"
                              : "border-red-400"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="font-medium text-gray-100">
                              {field.field}
                            </h5>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                field.success
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {field.success ? "Filled" : "Failed"}
                            </span>
                          </div>
                          <p className="text-gray-200 text-sm font-mono bg-black/20 p-2 rounded">
                            {field.value}
                          </p>
                          {field.selector && (
                            <p className="text-xs text-gray-400 mt-1">
                              Selector: {field.selector}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Screenshots */}
            {formFillResult.screenshots && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-100 mb-4">
                  Form Screenshots
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-200 mb-2">
                      Before Fill
                    </h5>
                    <img
                      src={`data:image/png;base64,${formFillResult.screenshots.before}`}
                      alt="Form before filling"
                      className="w-full rounded-lg border border-white/20"
                    />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-200 mb-2">
                      After Fill
                    </h5>
                    <img
                      src={`data:image/png;base64,${formFillResult.screenshots.after}`}
                      alt="Form after filling"
                      className="w-full rounded-lg border border-white/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Field Mapping Debug Info */}
            {formFillResult.fieldMapping && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-100 mb-4">
                  Field Mapping
                </h4>
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4">
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono">
                    {JSON.stringify(formFillResult.fieldMapping, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
