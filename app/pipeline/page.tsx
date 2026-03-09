import { Sidebar } from "@/components/sidebar";
import { PipelineCanvas } from "@/components/pipeline-canvas";

export default function PipelinePage() {
  return (
    <div className="flex h-screen bg-[#0D1117]">
      {/* Left Sidebar */}
      <Sidebar activePage="pipeline" />

      {/* Main Canvas Area */}
      <main className="flex-1 flex">
        <PipelineCanvas />
      </main>
    </div>
  );
}
