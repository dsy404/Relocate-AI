import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import VoiceCopilot from "@/components/voice/VoiceCopilot";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-cmd-bg w-full font-sans text-cmd-text selection:bg-blue-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-cmd-bg relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative scrollbar-thin scrollbar-thumb-cmd-border scrollbar-track-cmd-bg">
          {/* Subtle top glow effect behind main content for cinematic depth */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 w-full max-w-[1600px] mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
      <VoiceCopilot />
    </div>
  );
}
