import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { StackProvider, StackTheme } from "@stackframe/stack";

import "./globals.css";
import MainLayout from "@/components/layout/MainLayout";
import { AppProvider } from "@/context/AppContext";
import { VideoPlayerProvider } from "@/context/VideoPlayerContext";
import DraggableVideoPlayer from "@/components/ui/DraggableVideoPlayer";
import SmoothScrolling from "@/components/ui/SmoothScrolling";
import { stackServerApp } from "../stack";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xieriee 2.0 Flamethrower",
  description: "Advanced AI Chat Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a] text-white"><div className="text-center"><div className="mb-4">Loading...</div><div className="text-sm text-white/50">If this takes too long, please refresh the page</div></div></div>}>
              <AppProvider>
                <VideoPlayerProvider>
                  <SmoothScrolling>
                    <MainLayout>{children}</MainLayout>
                    <DraggableVideoPlayer />
                  </SmoothScrolling>
                </VideoPlayerProvider>
                <Toaster richColors position="top-center" theme="dark" />
              </AppProvider>
            </Suspense>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
