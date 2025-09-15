# 🚀 TicketToast Setup Guide

## Quick Setup for Testing (Without Google Cloud)

If you just want to see the UI and test the interface:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open the application**: Navigate to [http://localhost:3000](http://localhost:3000)

3. **Test the interface**: You can upload files and see the UI, but document processing won't work without Google Cloud setup.

---

## Full Setup with Google Cloud Document AI

### Prerequisites
- Google Cloud account with billing enabled
- Node.js 18+ installed
- gcloud CLI installed (optional but recommended)

### Step 1: Google Cloud Project Setup

1. **Create a new Google Cloud project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click "Select a project" → "New Project"
   - Enter project name (e.g., "tickettoast-demo")
   - Note your Project ID

2. **Enable the Document AI API**:
   ```bash
   gcloud services enable documentai.googleapis.com --project=YOUR_PROJECT_ID
   ```
   
   Or enable it in the console:
   - Go to APIs & Services → Library
   - Search for "Document AI API"
   - Click Enable

### Step 2: Create Document AI Processor

1. **Go to Document AI in Google Cloud Console**:
   - Navigate to Document AI → Processors
   - Click "Create Processor"
   - Choose "Document OCR" (for general documents)
   - Select region: "us" (recommended)
   - Give it a name like "TicketToast Processor"
   - Click Create

2. **Note your Processor ID**:
   - After creation, you'll see a processor ID (looks like: `1234567890abcdef`)
   - Copy this ID for later use

### Step 3: Authentication Setup

**Option A: Service Account (Recommended)**

1. **Create a service account**:
   ```bash
   gcloud iam service-accounts create tickettoast-sa \
     --description="Service account for TicketToast app" \
     --display-name="TicketToast Service Account"
   ```

2. **Grant permissions**:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:tickettoast-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/documentai.editor"
   ```

3. **Create and download key**:
   ```bash
   gcloud iam service-accounts keys create ./service-account-key.json \
     --iam-account=tickettoast-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

**Option B: Application Default Credentials (Development Only)**

```bash
gcloud auth application-default login
```

### Step 4: Environment Variables

1. **Update `.env.local`** with your actual values:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
   GOOGLE_CLOUD_PROCESSOR_ID=your-actual-processor-id
   GOOGLE_CLOUD_LOCATION=us
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   ```

### Step 5: Test the Application

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Upload a test document**:
   - Go to [http://localhost:3000](http://localhost:3000)
   - Drag and drop a parking citation (PDF, JPG, PNG)
   - Click "Process Document"
   - View the extracted information

---

## Testing with Sample Documents

For testing, you can use:
- Any parking ticket PDF
- Screenshots of parking citations
- Any document with text (receipts, forms, etc.)

The app will extract:
- License plate numbers
- Fine amounts
- Dates and times
- Violation types
- Locations
- Officer badge numbers

---

## Troubleshooting

### Common Errors

**"Google Cloud configuration missing"**
- Check that all environment variables are set
- Verify your `.env.local` file exists and has correct values

**"Permission denied"**
- Ensure your service account has `roles/documentai.editor` permission
- Check that the Document AI API is enabled

**"Processor not found"**
- Verify your processor ID is correct
- Ensure the processor exists in the same location (region)

**"Authentication error"**
- For service account: Check the path to your key file
- For ADC: Run `gcloud auth application-default login`

### Debug Mode

To see detailed error logs, check the browser console and terminal output when processing documents.

---

## Deployment

### Vercel Deployment

1. **Push to GitHub**
2. **Import in Vercel**
3. **Add environment variables** in Vercel dashboard:
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_CLOUD_PROCESSOR_ID` 
   - `GOOGLE_CLOUD_LOCATION`
   - Upload your service account key as a file or paste as `GOOGLE_APPLICATION_CREDENTIALS`

### Other Platforms

The app can be deployed to any Node.js hosting service that supports Next.js:
- Railway
- Render
- DigitalOcean App Platform
- AWS App Runner

---

## Cost Considerations

Document AI pricing (as of 2024):
- First 1,000 pages per month: FREE
- Additional pages: $1.50 per 1,000 pages

Perfect for testing and small-scale usage!

---

## Need Help?

- Check the [Google Cloud Document AI documentation](https://cloud.google.com/document-ai/docs)
- Review the [Next.js documentation](https://nextjs.org/docs)
- File issues in the GitHub repository
