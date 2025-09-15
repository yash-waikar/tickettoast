# 🎫 TicketToast

**AI-Powered Parking Citation Document Processor**

Upload parking tickets and automatically extract structured data using Google Cloud Document AI. Built with Next.js, TypeScript, and modern web technologies.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-Document_AI-4285f4)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8)

## ✨ Features

- 🎯 **Smart Document Processing**: Automatically extract key fields from parking citations
- 📁 **Drag & Drop Upload**: Modern file upload interface supporting PDF, JPG, PNG
- 🧠 **AI-Powered**: Uses Google Cloud Document AI for accurate OCR and field extraction
- 📊 **Structured Output**: Extracts license plate, violation type, fine amount, dates, and more
- 🔧 **Flexible Configuration**: Supports multiple Document AI processor types
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Real-time Processing**: Fast document analysis with progress indicators

## 🏗️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI/ML**: Google Cloud Document AI
- **File Handling**: React Dropzone
- **Authentication**: Google Cloud Service Account

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with Document AI API enabled
- Document AI processor (Custom Extraction, Form Parser, or OCR)

### 1. Clone & Install

```bash
git clone https://github.com/yash-waikar/tickettoast.git
cd tickettoast
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Configure your environment variables:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_PROCESSOR_ID=your_processor_id
GOOGLE_CLOUD_LOCATION=us

# Authentication (choose one method)
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

### 3. Google Cloud Setup

**Option A: Custom Extraction Processor (Recommended)**
1. Create a Custom Extraction Processor in Google Cloud Console
2. Upload the provided `parking-citation-schema.json` schema
3. Configure your processor ID in `.env.local`

**Option B: Alternative Processors**
- Use Form Parser (no schema required)
- Use Document OCR (simple text extraction)

📖 **Detailed setup instructions**: See [`PROCESSOR-SETUP.md`](./PROCESSOR-SETUP.md)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📋 Usage

1. **Upload Document**: Drag and drop or click to select a parking citation file
2. **AI Processing**: The document is processed using Google Cloud Document AI
3. **View Results**: Extracted fields are displayed with confidence scores
4. **Export Data**: Copy or use the structured data as needed

### Supported Fields

- 🚗 **License Plate Number**
- ⚖️ **Violation Type & Code** 
- 💰 **Fine Amount & Fees**
- 📅 **Issue Date & Due Date**
- 🕐 **Time Issued**
- 📍 **Location & Zone**
- 👮 **Officer Information**
- 🚙 **Vehicle Details**

## 🔧 Configuration

### Processor Types

| Type | Schema Required | Best For |
|------|----------------|----------|
| Custom Extraction | ✅ Yes | Parking citations (high accuracy) |
| Form Parser | ❌ No | General forms |
| Document OCR | ❌ No | Simple text extraction |

### Schema File

The included `parking-citation-schema.json` defines entity types for optimal extraction:

```json
{
  "entities": [
    { "type": "citation_number", "displayName": "Citation Number" },
    { "type": "plate_number", "displayName": "Plate Number" },
    { "type": "violation", "displayName": "Violation" },
    // ... more entities
  ]
}
```

## 📁 Project Structure

```
tickettoast/
├── src/
│   ├── app/
│   │   ├── api/process-document/route.ts  # Document AI API endpoint
│   │   ├── page.tsx                       # Main application page
│   │   └── layout.tsx                     # App layout
│   ├── components/
│   │   └── DocumentUpload.tsx             # Main upload component
│   └── types/
│       └── index.ts                       # Type definitions
├── parking-citation-schema.json          # Document AI schema
├── PROCESSOR-SETUP.md                    # Setup instructions
└── SETUP.md                             # Detailed configuration
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### API Endpoints

- `POST /api/process-document` - Process uploaded documents

### Error Handling

The application includes comprehensive error handling for:
- Authentication failures
- Processor configuration issues
- File format/size validation
- API rate limits and quotas

## 🔐 Security

- ✅ Service account keys excluded from version control
- ✅ Environment variables for sensitive configuration
- ✅ File type and size validation
- ✅ Secure API authentication with Google Cloud

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Cloud Document AI for powerful document processing
- Next.js team for the excellent framework
- Tailwind CSS for beautiful styling
- React Dropzone for smooth file uploads

---

**Built with ❤️ by [Yash Waikar](https://github.com/yash-waikar)**
