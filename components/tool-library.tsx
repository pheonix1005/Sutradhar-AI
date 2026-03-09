"use client";

import {
  Search,
  FileText,
  Calculator,
  Mail,
  Database,
  Globe,
  Calendar,
  Image,
  GripVertical
} from "lucide-react";

export type Tool = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
};

export const tools: Tool[] = [
  {
    id: "web-search",
    name: "Web Search",
    description: "Search the internet for information",
    icon: Search,
    category: "Research",
  },
  {
    id: "summarizer",
    name: "Summarizer",
    description: "Condense long text into key points",
    icon: FileText,
    category: "Content",
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform mathematical calculations",
    icon: Calculator,
    category: "Utility",
  },
  {
    id: "email",
    name: "Email Handler",
    description: "Read and compose emails",
    icon: Mail,
    category: "Communication",
  },
  {
    id: "database",
    name: "Database Query",
    description: "Access and query databases",
    icon: Database,
    category: "Data",
  },
  {
    id: "translator",
    name: "Translator",
    description: "Translate text between languages",
    icon: Globe,
    category: "Content",
  },
  {
    id: "scheduler",
    name: "Scheduler",
    description: "Manage calendar and reminders",
    icon: Calendar,
    category: "Utility",
  },
  {
    id: "image-gen",
    name: "Image Generator",
    description: "Create images from descriptions",
    icon: Image,
    category: "Creative",
  },
];

interface ToolLibraryProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function ToolLibrary({ onDragStart, onDragEnd }: ToolLibraryProps) {
  return (
    <aside className="w-80 h-screen bg-[#16211E] border-l border-[#D4AF37]/30 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#D4AF37]/30">
        <h3 className="font-serif text-lg font-bold text-[#E6E6E6] mb-1">
          Tool Library
        </h3>
        <p className="font-sans text-sm text-[#9CA3AF]">
          Drag tools to your agent
        </p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-[#D4AF37]/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search tools..."
            className="w-full bg-[#0D1117] border border-[#D4AF37]/30 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#E6E6E6] font-sans placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
          />
        </div>
      </div>

      {/* Tools List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isComingSoon = !["web-search", "summarizer"].includes(tool.id);
            return (
              <div
                key={tool.id}
                draggable
                onDragStart={(e) => {
                  const toolData = {
                    id: tool.id,
                    name: tool.name,
                    description: tool.description,
                    category: tool.category,
                  };
                  e.dataTransfer.setData("text/plain", JSON.stringify(toolData));
                  e.dataTransfer.effectAllowed = "copy";
                  onDragStart?.();
                }}
                onDragEnd={() => {
                  onDragEnd?.();
                }}
                className={`group relative bg-[#0D1117] border border-[#D4AF37]/30 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:border-[#D4AF37]/60 hover:shadow-lg hover:shadow-[#D4AF37]/5 transition-all duration-200 select-none ${isComingSoon ? "opacity-75" : ""}`}
              >
                {/* Coming Soon Tooltip */}
                {isComingSoon && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#E65100] text-[#E6E6E6] text-[10px] font-sans font-semibold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Coming Soon
                  </div>
                )}

                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-[#D4AF37]/50" />
                  </div>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-serif text-sm font-semibold text-[#E6E6E6] truncate">
                        {tool.name}
                      </h4>
                      <span className="text-[10px] font-sans uppercase tracking-wider text-[#D4AF37]/70 bg-[#D4AF37]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        {tool.category}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-[#9CA3AF] line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#D4AF37]/30">
        <button className="w-full flex items-center justify-center gap-2 text-[#D4AF37] hover:text-[#E65100] font-serif text-sm font-medium py-2 transition-colors duration-200">
          <span>+ Add Custom Tool</span>
        </button>
      </div>
    </aside>
  );
}
