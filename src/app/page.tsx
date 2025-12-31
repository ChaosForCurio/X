import { Suspense } from "react";
import ChatArea from "@/components/chat/ChatArea";
import { stackServerApp } from "../stack";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

const loadingFallback = (
  <div className="flex-1 flex flex-col items-center justify-center text-white/50">
    <div className="text-center">
      <div className="mb-4">Loading chat...</div>
      <div className="text-xs text-white/30">Please wait while we initialize your chat</div>
    </div>
  </div>
);

export default async function Home() {
  let user;
  try {
    user = await stackServerApp.getUser();
  } catch (error) {
    console.error("Error fetching user in Home:", error);
  }

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <Suspense fallback={loadingFallback}>
      <ChatArea />
    </Suspense>
  );
}
