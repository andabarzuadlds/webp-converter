"use client";

import { WebpConverter } from "@/components/WebpConverter";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <WebpConverter />
      </div>
    </main>
  );
}
