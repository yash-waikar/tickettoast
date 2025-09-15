<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# TicketToast - Document Processing Application

This is a Next.js React TypeScript application for processing parking citations and documents using Google Cloud Document AI.

## Project Overview

The application provides:
- Modern drag-and-drop file upload interface
- Integration with Google Cloud Document AI for OCR and document processing
- Structured field extraction (license plate, violation type, fine amount, date, location)
- Clean, responsive UI using Tailwind CSS
- API routes for handling document processing

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Cloud Service**: Google Cloud Document AI
- **File Handling**: Base64 encoding for document upload

## Key Features

1. **File Upload Component**: Drag-and-drop interface supporting PDF, JPG, PNG formats
2. **Document Processing API**: Server-side integration with Google Cloud Document AI
3. **Field Extraction**: Intelligent parsing of parking citation fields
4. **Results Display**: Clean presentation of extracted information
5. **Error Handling**: Proper error states and user feedback

## Environment Variables Required

```
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_PROCESSOR_ID=your_processor_id
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account_key.json
```

## Development Guidelines

- Use TypeScript for all components and API routes
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling with mobile-first approach
- Implement proper error boundaries and loading states
- Use server-side API routes for Google Cloud integration
- Keep components modular and reusable
