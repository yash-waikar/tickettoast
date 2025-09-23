"use client";

import { DocumentUpload } from "@/components/DocumentUpload";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-orange-300 to-red-300 flex flex-col items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Ticket Toast
          </h1>
        </header>

        <main className="w-full max-w-7xl flex-1 flex items-center justify-center">
          <DocumentUpload />
        </main>
      </div>
    </div>
  );
}
