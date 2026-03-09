"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Sparkles, User, MessageSquare, X, Search, FileText, Calculator, Mail, Database, Globe, Calendar, Image, LayoutGrid, Download, History } from "lucide-react";
import { usePipeline } from "@/lib/pipeline-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "web-search": Search,
  "summarizer": FileText,
  "calculator": Calculator,
  "email": Mail,
  "database": Database,
  "translator": Globe,
  "scheduler": Calendar,
  "image-gen": Image,
};

export type ConnectedTool = {
  id: string;
  name: string;
  description: string;
  category: string;
};

const roleOptions = [
  { id: "assistant", label: "Personal Assistant", description: "General-purpose helper" },
  { id: "researcher", label: "Researcher", description: "Web search & data analysis" },
  { id: "writer", label: "Content Writer", description: "Create & edit content" },
  { id: "customer-support", label: "Customer Support", description: "Handle customer queries" },
  { id: "inventory", label: "Inventory Manager", description: "Track stock & orders" },
  { id: "custom", label: "Custom Role", description: "Define your own" },
];

const personalityOptions = [
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "friendly", label: "Friendly", emoji: "😊" },
  { id: "concise", label: "Concise", emoji: "⚡" },
  { id: "creative", label: "Creative", emoji: "🎨" },
];

interface AgentFormProps {
  connectedTools: ConnectedTool[];
  onAddTool: (tool: ConnectedTool) => void;
  onRemoveTool: (toolId: string) => void;
  isDragging: boolean;
}

export function AgentForm({ connectedTools, onAddTool, onRemoveTool, isDragging }: AgentFormProps) {
  const [agentName, setAgentName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [selectedOutputType, setSelectedOutputType] = useState("markdown");
  const [savedAgents, setSavedAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const dragCounter = useRef(0);

  const {
    setPersonality,
    setAgentRole: setGlobalRole,
    setAgentName: setGlobalAgentName,
    setCustomInstructions: setGlobalInstructions,
    setDeployedConfig,
    setOutputType
  } = usePipeline();

  // Fetch saved agents
  const fetchAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const res = await fetch("http://localhost:3001/api/agents");
      if (res.ok) {
        const data = await res.json();
        setSavedAgents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Agents server offline or starting up.", err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingAgents(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSelectSavedAgent = (agent: any) => {
    setAgentName(agent.name);
    // Find matching role ID if possible
    const roleId = roleOptions.find(r => r.label === agent.role)?.id || "custom";
    setSelectedRole(roleId);
    setSelectedPersonality(agent.personality || "professional");
    setCustomInstructions(agent.customInstructions || "");
    setSelectedOutputType(agent.outputType || "markdown");

    // Auto-deploy when selected
    setDeployedConfig("agent");
    setOutputType(agent.outputType || "markdown");
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
  };

  // Sync to global context
  useEffect(() => {
    setGlobalAgentName(agentName);
    const roleLabel = roleOptions.find(r => r.id === selectedRole)?.label || selectedRole;
    setGlobalRole(roleLabel);
    setPersonality(selectedPersonality);
    setGlobalInstructions(customInstructions);
    setOutputType(selectedOutputType);
  }, [agentName, selectedRole, selectedPersonality, customInstructions, selectedOutputType]);

  const handleCreateAgent = async () => {
    if (!agentName || !selectedRole) return;
    setIsCreating(true);
    try {
      const roleLabel = roleOptions.find(r => r.id === selectedRole)?.label || selectedRole;
      const res = await fetch("http://localhost:3001/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agentName,
          role: roleLabel,
          personality: selectedPersonality,
          customInstructions,
          outputType: selectedOutputType
        }),
      });
      if (res.ok) {
        setDeployedConfig("agent");
        setIsSuccess(true);
        fetchAgents(); // Refresh list
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to create agent", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDropZoneActive(false);

    try {
      const data = e.dataTransfer.getData("text/plain");
      if (data) {
        const tool: ConnectedTool = JSON.parse(data);
        onAddTool(tool);
      }
    } catch (err) {
      console.error("Failed to parse dropped tool data", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDropZoneActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDropZoneActive(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="font-serif text-2xl font-bold text-[#E6E6E6] mb-2">
            Create Your AI Agent
          </h2>
          <p className="font-sans text-[#9CA3AF]">
            Define your agent&apos;s identity, role, and personality. Drag tools from the library to enhance capabilities.
          </p>
        </div>

        {/* Saved Agents Gallery */}
        <div className="mb-10 p-6 bg-[#0D1117] border border-[#D4AF37]/20 rounded-xl">
          <label className="flex items-center gap-2 font-serif text-sm font-semibold text-[#D4AF37] mb-4">
            <History className="w-4 h-4" />
            Saved Agents & Quick Reuse
          </label>

          {isLoadingAgents ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-xs text-[#9CA3AF] animate-pulse">Loading agents...</span>
            </div>
          ) : savedAgents.length === 0 ? (
            <p className="text-xs text-[#6B7280] italic">No saved agents found. Create your first one below!</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {savedAgents.map((agent) => (
                <button
                  key={agent._id}
                  onClick={() => handleSelectSavedAgent(agent)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#16211E] border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
                    <Bot className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#E6E6E6] truncate">{agent.name}</p>
                    <p className="text-[10px] text-[#9CA3AF] truncate">{agent.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Agent Name */}
        <div className="mb-6">
          <label className="flex items-center gap-2 font-serif text-sm font-semibold text-[#D4AF37] mb-3">
            <Bot className="w-4 h-4" />
            Agent Name
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="e.g., Inventory Helper, Email Assistant..."
            className="w-full bg-[#16211E] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-[#E6E6E6] font-sans placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
          />
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="flex items-center gap-2 font-serif text-sm font-semibold text-[#D4AF37] mb-3">
            <User className="w-4 h-4" />
            Agent Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 rounded-lg border text-left transition-all duration-200 ${selectedRole === role.id
                  ? "bg-[#E65100]/10 border-[#E65100] ring-1 ring-[#E65100]/30"
                  : "bg-[#16211E] border-[#D4AF37]/30 hover:border-[#D4AF37]/60"
                  }`}
              >
                <p className={`font-serif text-sm font-semibold mb-1 ${selectedRole === role.id ? "text-[#E65100]" : "text-[#E6E6E6]"
                  }`}>
                  {role.label}
                </p>
                <p className="font-sans text-xs text-[#9CA3AF]">{role.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div className="mb-6">
          <label className="flex items-center gap-2 font-serif text-sm font-semibold text-[#D4AF37] mb-3">
            <Sparkles className="w-4 h-4" />
            Personality Style
          </label>
          <div className="flex flex-wrap gap-3">
            {personalityOptions.map((personality) => (
              <button
                key={personality.id}
                onClick={() => setSelectedPersonality(personality.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 ${selectedPersonality === personality.id
                  ? "bg-[#E65100] border-[#E65100] text-[#E6E6E6]"
                  : "bg-[#16211E] border-[#D4AF37]/30 text-[#9CA3AF] hover:border-[#D4AF37]/60 hover:text-[#E6E6E6]"
                  }`}
              >
                <span>{personality.emoji}</span>
                <span className="font-serif text-sm font-medium">{personality.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="mb-8">
          <label className="flex items-center gap-2 font-serif text-sm font-semibold text-[#D4AF37] mb-3">
            <MessageSquare className="w-4 h-4" />
            Custom Instructions (Optional)
          </label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add any specific instructions for your agent..."
            rows={4}
            className="w-full bg-[#16211E] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-[#E6E6E6] font-sans placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all resize-none"
          />
        </div>

        {/* Output Format */}
        <div className="mb-8">
          <label className="flex items-center gap-2 font-serif text-sm font-semibold text-[#D4AF37] mb-3">
            <Download className="w-4 h-4" />
            Preferred Output Format
          </label>
          <div className="flex gap-3">
            {[
              { id: "markdown", label: "Markdown", icon: FileText },
              { id: "pdf", label: "PDF Doc", icon: LayoutGrid },
              { id: "txt", label: "Text File", icon: MessageSquare },
              { id: "email", label: "Email Link", icon: Mail },
            ].map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedOutputType(format.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all duration-200 ${selectedOutputType === format.id
                  ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                  : "bg-[#16211E] border-[#D4AF37]/20 text-[#9CA3AF] hover:border-[#D4AF37]/40"
                  }`}
              >
                <format.icon className="w-3.5 h-3.5" />
                {format.label}
              </button>
            ))}
          </div>
        </div>

        {/* Connected Tools Drop Zone */}
        <div
          className={`mb-8 p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${isDropZoneActive || isDragging
            ? "bg-[#E65100]/10 border-[#E65100]"
            : "bg-[#16211E] border-[#D4AF37]/30"
            }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          <p className="font-serif text-sm font-semibold text-[#D4AF37] mb-3">Connected Tools</p>

          {connectedTools.length === 0 ? (
            <div className={`flex items-center justify-center gap-2 py-6 text-sm transition-colors ${isDropZoneActive || isDragging ? "text-[#E65100]" : "text-[#9CA3AF]"
              }`}>
              <span className={`w-2 h-2 rounded-full transition-colors ${isDropZoneActive || isDragging ? "bg-[#E65100] animate-pulse" : "bg-[#D4AF37]/30"
                }`}></span>
              <span className="font-sans">
                {isDropZoneActive ? "Drop tool here!" : isDragging ? "Drop tool here to connect" : "Drag tools from the library to connect them"}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {connectedTools.map((tool) => {
                const Icon = iconMap[tool.id] || Bot;
                return (
                  <div
                    key={tool.id}
                    className="flex items-center gap-2 bg-[#0D1117] border border-[#D4AF37]/50 rounded-lg px-3 py-2 group"
                  >
                    <div className="w-6 h-6 rounded bg-[#D4AF37]/10 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </div>
                    <span className="font-sans text-sm text-[#E6E6E6]">{tool.name}</span>
                    <button
                      onClick={() => onRemoveTool(tool.id)}
                      className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#E65100] hover:bg-[#E65100]/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Show drop hint when dragging and already have tools */}
              {(isDropZoneActive || isDragging) && (
                <div className="flex items-center gap-2 border-2 border-dashed border-[#E65100]/50 rounded-lg px-3 py-2 text-[#E65100]">
                  <span className="w-2 h-2 rounded-full bg-[#E65100] animate-pulse"></span>
                  <span className="font-sans text-sm">Drop here</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleCreateAgent}
            disabled={!agentName || !selectedRole || isCreating}
            className={`flex-1 font-serif font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg ${isSuccess
              ? "bg-green-600 text-[#E6E6E6]"
              : "bg-[#E65100] hover:bg-[#E65100]/90 text-[#E6E6E6] hover:shadow-[#E65100]/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isCreating ? "Saving..." : isSuccess ? "Agent Created & Deployed!" : "Create Agent"}
          </button>
          <button className="px-6 py-3 border border-[#D4AF37]/30 text-[#9CA3AF] hover:text-[#E6E6E6] hover:border-[#D4AF37]/60 font-serif font-medium rounded-lg transition-all duration-200">
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}
