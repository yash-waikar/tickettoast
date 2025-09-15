# Demo Configuration

This folder contains sample configurations and test files for demonstrating TicketToast functionality.

## Sample Environment Variables

For demonstration purposes, here are example values:

```env
GOOGLE_CLOUD_PROJECT_ID=tickettoast-demo-123456
GOOGLE_CLOUD_PROCESSOR_ID=1a2b3c4d5e6f7g8h
GOOGLE_CLOUD_LOCATION=us
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

## Test Documents

The application works best with:

1. **Parking Citations (PDF)**: Official parking tickets with structured information
2. **Citation Photos (JPG/PNG)**: Clear photos of parking tickets
3. **Traffic Violation Documents**: Any structured document with violation information

## Expected Extraction Fields

The application is configured to extract:

- **License Plate**: Vehicle license plate numbers
- **Violation Type**: Type of parking violation
- **Fine Amount**: Monetary penalty amount
- **Date**: Date of violation
- **Time**: Time of violation
- **Location**: Street address or location
- **Officer Badge**: Issuing officer's badge number
- **Citation Number**: Unique ticket identifier

## API Response Example

```json
{
  "success": true,
  "text": "PARKING VIOLATION NOTICE\nLicense Plate: ABC123\nViolation: Expired Meter\n...",
  "extractedFields": [
    {
      "label": "License Plate",
      "value": "ABC123",
      "confidence": 0.95
    },
    {
      "label": "Fine Amount",
      "value": "75.00",
      "confidence": 0.88
    },
    {
      "label": "Violation Type", 
      "value": "Expired Meter",
      "confidence": 0.92
    }
  ],
  "processingTime": 1247
}
```
