'use client';

import { DocumentUpload } from '@/components/DocumentUpload';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚗 TicketToast
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload parking citations or documents to extract structured information using Google Cloud Document AI
          </p>
        </header>
        
        <main className="max-w-4xl mx-auto">
          <DocumentUpload />
        </main>
      </div>
    </div>
  );
}
