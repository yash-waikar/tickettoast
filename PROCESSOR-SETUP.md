# Document AI Processor Setup Guide

## Problem
You're getting a 400 error: "Must have at least one entity type" because your processor is a **Custom Extraction Processor** that requires an entity schema to be defined.

## Solution Options

### Option 1: Add Schema to Your Existing Processor (Recommended)

1. **Go to Google Cloud Console**
   - Navigate to [Google Cloud Console](https://console.cloud.google.com/)
   - Go to Document AI → Processors
   - Click on your processor (ID: `a22dab6a55e6f57c`)

2. **Upload the Schema**
   - Click on the "Schema" tab
   - Click "Upload Schema"
   - Select the `parking-citation-schema.json` file from this project
   - Save the changes

3. **Test Your Processor**
   - The processor will now know what fields to extract
   - Your existing API code should work without changes

### Option 2: Create a New General Processor (Alternative)

If you prefer a simpler setup:

1. **Create a New Processor**
   - Go to Document AI → Processors → Create Processor
   - Choose **"Form Parser"** or **"Document OCR"** instead of Custom Extraction
   - These don't require schemas and work out of the box

2. **Update Your Environment**
   - Copy the new processor ID
   - Update `GOOGLE_CLOUD_PROCESSOR_ID` in your `.env.local` file

## Schema File Details

The `parking-citation-schema.json` file in this project contains entity definitions for:

- Citation Number
- Plate Number  
- Violation Type
- Issue Date
- State
- Zone
- Vehicle Make
- Street Address
- Officer Information
- Fee Schedule
- Due Date
- Fine Amount
- Vehicle Color
- Location
- Time Issued

## Expected API Request Format

Once the schema is uploaded, your requests will work with this format:

```json
{
  "rawDocument": {
    "mimeType": "image/jpeg",
    "content": "[BASE64_CONTENT]"
  },
  "processOptions": {
    "ocrConfig": {
      "enableNativePdfParsing": true
    }
  }
}
```

The processor will automatically extract the entities defined in your schema.

## Verification Steps

1. Upload the schema to your processor
2. Run the TicketToast application
3. Upload a parking citation document
4. Check that extraction works without the entity_types error

## Troubleshooting

If you still get errors:
- Verify the schema uploaded correctly
- Check processor permissions
- Ensure Document AI API is enabled
- Verify service account has Document AI permissions

## Alternative Processors

For testing purposes, you might want to try these processor types:
- **Form Parser**: General form processing, no schema required
- **Document OCR**: Text extraction only, very simple
- **Invoice Processor**: Pre-configured for invoice-like documents
