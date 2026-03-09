"use client";

import { useState, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { AgentForm } from "@/components/agent-form";
import { ToolLibrary } from "@/components/tool-library";

export type ConnectedTool = {
  id: string;
  name: string;
  description: string;
  category: string;
};

export default function AgentBuilderPage() {
  const [connectedTools, setConnectedTools] = useState<ConnectedTool[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragCounter.current = 0;
  };

  const handleAddTool = (tool: ConnectedTool) => {
    if (!connectedTools.find(t => t.id === tool.id)) {
      setConnectedTools(prev => [...prev, tool]);
    }
  };

  const handleRemoveTool = (toolId: string) => {
    setConnectedTools(prev => prev.filter(t => t.id !== toolId));
  };

  return (
    <div className="flex h-screen bg-[#0D1117] overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <Sidebar activePage="builder" />

      {/* Center - Agent Configuration Form */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-[#16211E] border-b border-[#D4AF37]/30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-lg font-semibold text-[#E6E6E6]">
              Visual Agent Builder
            </h1>
            <span className="text-xs font-sans text-[#9CA3AF] bg-[#0D1117] px-3 py-1 rounded-full border border-[#D4AF37]/30">
              Draft
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Preview - Coming Soon */}
            <div className="relative group/preview">
              <button className="text-sm font-sans text-[#9CA3AF] hover:text-[#E6E6E6] transition-colors cursor-not-allowed opacity-60">
                Preview
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#E65100] text-[#E6E6E6] text-[10px] font-sans font-semibold rounded opacity-0 group-hover/preview:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Coming Soon
              </div>
            </div>
            {/* Test Run - Coming Soon */}
            <div className="relative group/testrun">
              <button className="text-sm font-sans text-[#9CA3AF] hover:text-[#E6E6E6] transition-colors cursor-not-allowed opacity-60">
                Test Run
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#E65100] text-[#E6E6E6] text-[10px] font-sans font-semibold rounded opacity-0 group-hover/testrun:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Coming Soon
              </div>
            </div>
            <button className="bg-[#E65100] hover:bg-[#E65100]/90 text-[#E6E6E6] font-serif text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-[#E65100]/20">
              Deploy
            </button>
          </div>
        </header>

        {/* Form Content */}
        <AgentForm
          connectedTools={connectedTools}
          onAddTool={handleAddTool}
          onRemoveTool={handleRemoveTool}
          isDragging={isDragging}
        />
      </main>

      {/* Right Panel - Tool Library */}
      <ToolLibrary
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
}
