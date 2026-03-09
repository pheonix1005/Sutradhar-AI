import { Sidebar } from "@/components/sidebar";
import { ActivityLog } from "@/components/activity-log";

export default function ActivityPage() {
  return (
    <div className="flex h-screen bg-[#0D1117] overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar activePage="activity" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="shrink-0 px-8 py-6 border-b border-[#D4AF37]/20 bg-[#0D1117]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#E6E6E6]">
                Real-time Activity Log
              </h1>
              <p className="text-[#9CA3AF] font-sans text-sm mt-1">
                Monitor agent actions, thoughts, and outputs in real-time
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-[#16211E] border border-[#D4AF37]/30 rounded-lg">
                <span className="text-xs text-[#9CA3AF] font-sans">Pipeline Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                  <span className="text-sm text-[#E6E6E6] font-serif font-medium">Running</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Activity Log Component */}
        <div className="flex-1 min-h-0 bg-[#16211E] m-6 rounded-xl border border-[#D4AF37]/20 flex flex-col overflow-hidden">
          <ActivityLog />
        </div>
      </main>
    </div>
  );
}
