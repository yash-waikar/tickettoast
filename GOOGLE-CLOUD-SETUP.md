# Google Cloud Authentication Setup

This guide will help you set up Google Cloud authentication for the TicketToast application.

## Prerequisites

1. You need a Google Cloud Project
2. Document AI API must be enabled
3. A service account with proper permissions

## Setup Options

### Option 1: Service Account Key File (Recommended for Development)

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Select your project (`tickettoast`)

2. **Navigate to Service Accounts**
   - Go to IAM & Admin → Service Accounts
   - Find your service account or create a new one

3. **Download Key File**
   - Click on your service account
   - Go to the "Keys" tab
   - Click "Add Key" → "Create New Key" → "JSON"
   - Download the JSON file

4. **Place Key File**
   - Put the downloaded JSON file in your project root directory
   - Rename it to something like `tickettoast-service-account.json`

5. **Update Environment Variables**
   ```bash
   # In your .env file
   GOOGLE_APPLICATION_CREDENTIALS=./tickettoast-service-account.json
   ```

### Option 2: Environment Variables

If you prefer not to use a key file, you can set credentials directly:

1. **Extract from Key File**
   - Open your service account key JSON file
   - Copy the `client_email` and `private_key` values

2. **Set Environment Variables**
   ```bash
   # In your .env file
   GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@tickettoast.iam.gserviceaccount.com
   GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   ```

## Required Permissions

Your service account needs these roles:
- `Document AI API User`
- `Document AI Editor` (if creating/managing processors)

## Verification

After setup, restart your development server:
```bash
npm run dev
```

Try uploading a document to test the authentication.

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check if your key file path is correct
   - Verify the key file is valid JSON
   - Ensure the service account has proper permissions

2. **"Processor not found"**
   - Verify your `GOOGLE_CLOUD_PROCESSOR_ID` is correct
   - Check if the processor exists in the specified location

3. **"Access denied"**
   - Enable Document AI API for your project
   - Check service account permissions

### Environment Variables Reference

```bash
# Required
GOOGLE_CLOUD_PROJECT_ID=tickettoast
GOOGLE_CLOUD_PROCESSOR_ID=a22dab6a55e6f57c
GOOGLE_CLOUD_LOCATION=us

# Authentication (choose one method)
# Method 1: Key file
GOOGLE_APPLICATION_CREDENTIALS=./your-key-file.json

# Method 2: Direct credentials
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key\n-----END PRIVATE KEY-----\n"
```

## Security Notes

- Never commit service account key files to version control
- Add your key file to `.gitignore`
- For production, use more secure authentication methods like Workload Identity
