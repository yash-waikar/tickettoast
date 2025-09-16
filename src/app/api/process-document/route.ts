import { NextRequest, NextResponse } from "next/server";
import { toast } from "sonner";

interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

interface DocumentEntity {
  type?: string;
  textAnchor?: {
    content?: string;
  };
  mentionText?: string;
  confidence?: number;
}

interface FormField {
  fieldName?: {
    textAnchor?: {
      content?: string;
    };
  };
  fieldValue?: {
    textAnchor?: {
      content?: string;
    };
  };
}

interface ProcessedDocument {
  text?: string;
  entities?: DocumentEntity[];
  formFields?: FormField[];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    console.log("Form data received:", formData.keys());
    console.log(
      "File received:",
      file ? `${file.name} (${file.size} bytes, ${file.type})` : "No file"
    );

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF, JPG, or PNG file." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Please upload a file smaller than 10MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64Content = Buffer.from(bytes).toString("base64");
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID;
    const location =
      process.env.GOOGLE_CLOUD_LOCATION ||
      process.env.NEXT_PUBLIC_LOCATION ||
      "us";

    if (!projectId || !processorId) {
      return NextResponse.json(
        {
          error:
            "Google Cloud configuration missing. Please set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_PROCESSOR_ID environment variables.",
          isConfigError: true,
        },
        { status: 500 }
      );
    }

    let accessToken: string;
    try {
      const { GoogleAuth } = require("google-auth-library");

      let authConfig: any = {
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      };

      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        authConfig.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      } else if (
        process.env.GOOGLE_CLOUD_CLIENT_EMAIL &&
        process.env.GOOGLE_CLOUD_PRIVATE_KEY
      ) {
        authConfig.credentials = {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(
            /\\n/g,
            "\n"
          ),
        };
        authConfig.projectId = projectId;
      }

      const auth = new GoogleAuth(authConfig);

      const authClient = await auth.getClient();
      const accessTokenResponse = await authClient.getAccessToken();

      if (!accessTokenResponse.token) {
        throw new Error("Failed to get access token");
      }

      accessToken = accessTokenResponse.token;
    } catch (error) {
      console.error("Authentication error:", error);
      return NextResponse.json(
        {
          error:
            "Authentication failed. Please set up Google Cloud credentials.",
          isConfigError: true,
          details: error instanceof Error ? error.message : "Unknown error",
          solutions: [
            {
              method: "Service Account Key File",
              steps: [
                "1. Download your service account key file from Google Cloud Console",
                "2. Place it in your project root directory",
                "3. Set GOOGLE_APPLICATION_CREDENTIALS=./your-key-file.json in your .env file",
              ],
            },
            {
              method: "Environment Variables",
              steps: [
                "1. Set GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com",
                '2. Set GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour key\\n-----END PRIVATE KEY-----\\n"',
                "3. Make sure to escape newlines with \\n in the private key",
              ],
            },
          ],
        },
        { status: 401 }
      );
    }

    const processorInfoUrl = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}`;

    let processorType = "FORM_PARSER_PROCESSOR";
    try {
      const processorResponse = await fetch(processorInfoUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (processorResponse.ok) {
        const processorInfo = await processorResponse.json();
        console.log("Processor info:", JSON.stringify(processorInfo, null, 2));
        processorType = processorInfo.type || "FORM_PARSER_PROCESSOR";
      } else {
        console.log(
          "Could not fetch processor info, assuming FORM_PARSER_PROCESSOR"
        );
      }
    } catch (error) {
      console.log("Could not fetch processor info:", error);
    }

    let mimeType = file.type;
    if (file.type === "image/jpeg") {
      mimeType = "image/jpeg";
    } else if (file.type === "image/png") {
      mimeType = "image/png";
    } else if (file.type === "application/pdf") {
      mimeType = "application/pdf";
    }

    let requestBody: any = {
      rawDocument: {
        mimeType: mimeType,
        content: base64Content,
      },
    };

    if (processorType === "FORM_PARSER_PROCESSOR") {
      requestBody.fieldMask = "text,entities,pages.formFields";
      requestBody.processOptions = {
        ocrConfig: {
          enableNativePdfParsing: true,
          enableImageQualityScores: true,
          enableSymbol: true,
        },
      };
    } else if (processorType === "OCR_PROCESSOR") {
      requestBody.processOptions = {
        ocrConfig: {
          enableNativePdfParsing: true,
          enableImageQualityScores: true,
          enableSymbol: true,
        },
      };
    } else if (processorType === "CUSTOM_EXTRACTION_PROCESSOR") {
      console.log("Using CUSTOM_EXTRACTION_PROCESSOR - no OCR config needed");
    } else {
      console.log("Unknown processor type, using minimal configuration");
    }

    // Make the API request to Google Cloud Document AI
    const apiUrl = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;

    console.log(
      "Processing document with Google Cloud Document AI REST API..."
    );
    console.log("API URL:", apiUrl);
    console.log("Processor Type:", processorType);
    console.log(
      "Request body structure:",
      JSON.stringify(
        requestBody,
        (key, value) => (key === "content" ? "[BASE64_CONTENT]" : value),
        2
      )
    );

    let response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 400 && errorText.includes("entity_types")) {
        console.log("Retrying with simplified request body...");
        const simpleRequestBody = {
          rawDocument: {
            mimeType: mimeType,
            content: base64Content,
          },
        };

        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(simpleRequestBody),
        });

        if (!response.ok) {
          const retryErrorText = await response.text();
          console.error("Document AI API Error (after retry):", {
            status: response.status,
            statusText: response.statusText,
            error: retryErrorText,
            url: apiUrl,
            projectId,
            processorId,
            location,
            processorType,
          });

          if (response.status === 401) {
            return NextResponse.json(
              {
                error: "Authentication failed. Please check your credentials.",
                isConfigError: true,
              },
              { status: 401 }
            );
          } else if (response.status === 403) {
            return NextResponse.json(
              {
                error:
                  "Access denied. The service account may not have the required permissions or the Document AI API may not be enabled for this project.",
                isConfigError: true,
                details: retryErrorText,
              },
              { status: 403 }
            );
          } else if (response.status === 404) {
            return NextResponse.json(
              {
                error:
                  "Processor not found. Please check your GOOGLE_CLOUD_PROCESSOR_ID.",
                isConfigError: true,
              },
              { status: 404 }
            );
          }

          return NextResponse.json(
            {
              error: "Failed to process document with Document AI API.",
              details: retryErrorText,
            },
            { status: response.status }
          );
        }
      } else {
        console.error("Document AI API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: apiUrl,
          projectId,
          processorId,
          location,
          processorType,
        });

        // Parse error details if it's JSON
        let errorDetails: any = {};
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          // If not JSON, use the raw text
          errorDetails = { message: errorText };
        }

        if (response.status === 401) {
          return NextResponse.json(
            {
              error: "Authentication failed. Please check your credentials.",
              isConfigError: true,
            },
            { status: 401 }
          );
        } else if (response.status === 403) {
          return NextResponse.json(
            {
              error:
                "Access denied. The service account may not have the required permissions or the Document AI API may not be enabled for this project.",
              isConfigError: true,
              details: errorText,
            },
            { status: 403 }
          );
        } else if (response.status === 404) {
          return NextResponse.json(
            {
              error:
                "Processor not found. Please check your GOOGLE_CLOUD_PROCESSOR_ID.",
              isConfigError: true,
            },
            { status: 404 }
          );
        } else if (
          response.status === 400 &&
          errorText.includes("entity_types")
        ) {
          // Handle the specific entity types error for Custom Extraction Processors
          return NextResponse.json(
            {
              error: "Custom Extraction Processor Schema Missing",
              isConfigError: true,
              details:
                "Your processor is a Custom Extraction Processor but no entity schema is defined.",
              solution: {
                step1:
                  "Go to Google Cloud Console → Document AI → Processors → Your Processor",
                step2: 'Click on the "Schema" tab',
                step3:
                  "Upload an entity schema JSON file defining the fields to extract",
                exampleSchema: {
                  entities: [
                    { type: "citation_number", displayName: "Citation Number" },
                    { type: "plate_number", displayName: "Plate Number" },
                    { type: "violation", displayName: "Violation" },
                    { type: "issue_date", displayName: "Issue Date" },
                    { type: "state", displayName: "State" },
                    { type: "zone", displayName: "Zone" },
                    { type: "vehicle_make", displayName: "Vehicle Make" },
                    { type: "street", displayName: "Street" },
                    { type: "officer", displayName: "Officer" },
                    { type: "fine_amount", displayName: "Fine Amount" },
                  ],
                },
              },
              alternativeSolution:
                'Create a new processor using "Form Parser" or "Document OCR" processor type instead, which don\'t require custom schemas.',
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            error: "Failed to process document with Document AI API.",
            details: errorDetails?.error?.message || errorText,
          },
          { status: response.status }
        );
      }
    }

    const result = await response.json();
    // Extract text and process the document
    const rawText = result.document?.text || "";

    // Extract structured fields for parking citations
    const processedDocument: ProcessedDocument = {
      text: result.document?.text || undefined,
      entities: (result.document?.entities as DocumentEntity[]) || undefined,
      formFields: result.document?.pages?.[0]?.formFields || undefined,
    };
    const extractedFields: ExtractedField[] =
      extractParkingCitationFields(processedDocument);

    return NextResponse.json({
      success: true,
      text: rawText,
      extractedFields,
      processingTime: Date.now(),
    });
  } catch (error) {
    console.error("Error processing document:", error);

    // Log more detailed error information for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to process document. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function extractParkingCitationFields(
  document: ProcessedDocument | undefined
): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const text = document?.text || "";

  // Common parking citation patterns
  const patterns = {
    "License Plate": [
      /(?:license\s*(?:plate)?|plate)\s*(?:number|#)?\s*:?\s*([A-Z0-9]{2,8})/i,
      /(?:lic\s*#|plate\s*#)\s*:?\s*([A-Z0-9]{2,8})/i,
      /\b([A-Z]{1,3}\s*\d{1,4}[A-Z]?|\d{1,3}\s*[A-Z]{1,3})\b/g,
    ],
    "Violation Type": [
      /(?:violation|offense|charge)\s*:?\s*([^\n]{10,60})/i,
      /(?:code|section)\s*:?\s*([^\n]{5,50})/i,
    ],
    "Fine Amount": [
      /(?:fine|amount|total|penalty)\s*:?\s*\$?(\d+(?:\.\d{2})?)/i,
      /\$(\d+(?:\.\d{2})?)/g,
    ],
    Date: [
      /(?:date|issued|violation\s*date)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
    ],
    Time: [
      /(?:time)\s*:?\s*(\d{1,2}:\d{2}(?:\s*[ap]m)?)/i,
      /\b(\d{1,2}:\d{2}(?:\s*[ap]m)?)\b/g,
    ],
    Location: [/(?:location|address|street)\s*:?\s*([^\n]{10,80})/i],
    "Officer Badge": [/(?:officer|badge)\s*(?:number|#)?\s*:?\s*(\d+)/i],
    "Citation Number": [/(?:citation|ticket|number|#)\s*:?\s*([A-Z0-9]+)/i],
  };

  // Extract fields using patterns
  for (const [fieldName, fieldPatterns] of Object.entries(patterns)) {
    let bestMatch = "";
    let highestConfidence = 0;

    for (const pattern of fieldPatterns) {
      const matches = text.match(pattern);
      if (matches && matches[1]) {
        const match = matches[1].trim();
        if (match.length > bestMatch.length) {
          bestMatch = match;
          highestConfidence = 0.8; // Simulated confidence
        }
      }
    }

    if (bestMatch) {
      fields.push({
        label: fieldName,
        value: bestMatch,
        confidence: highestConfidence,
      });
    }
  }

  // If we have entities from Document AI, use those too
  if (document?.entities) {
    for (const entity of document.entities) {
      const entityType = entity.type || "Unknown";
      const entityText = entity.textAnchor?.content || entity.mentionText || "";
      const confidence = entity.confidence || 0.5;

      if (entityText && confidence > 0.3) {
        // Check if we already have this type of field
        const existingField = fields.find((f) =>
          f.label.toLowerCase().includes(entityType.toLowerCase())
        );
        if (!existingField || confidence > existingField.confidence) {
          if (existingField) {
            existingField.value = entityText;
            existingField.confidence = confidence;
          } else {
            fields.push({
              label: entityType,
              value: entityText,
              confidence,
            });
          }
        }
      }
    }
  }

  // If we have form fields from Document AI, use those too
  if (document?.formFields) {
    for (const formField of document.formFields) {
      const fieldName =
        formField.fieldName?.textAnchor?.content?.trim() || "Unknown Field";
      const fieldValue =
        formField.fieldValue?.textAnchor?.content?.trim() || "";

      if (fieldValue) {
        // Check if we already have this field
        const existingField = fields.find(
          (f) =>
            f.label.toLowerCase().includes(fieldName.toLowerCase()) ||
            fieldName.toLowerCase().includes(f.label.toLowerCase())
        );

        if (!existingField) {
          fields.push({
            label: fieldName,
            value: fieldValue,
            confidence: 0.9, // Form fields typically have high confidence
          });
        } else if (fieldValue.length > existingField.value.length) {
          // Use the longer/more complete value
          existingField.value = fieldValue;
          existingField.confidence = 0.9;
        }
      }
    }
  }

  return fields;
}
