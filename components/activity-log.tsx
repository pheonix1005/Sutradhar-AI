"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Send,
  Bot,
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Filter,
  Trash2,
  Clock,
  Zap,
  MessageSquare,
  Lightbulb,
  FileOutput,
  Download,
  Mail as MailIcon,
  Maximize2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIStatus } from "@/hooks/use-ai-status";
import { usePipeline, buildPipelineDescription } from "@/lib/pipeline-context";
import { MarkdownOutput } from "./markdown-output";
import {
  getOutputTypeForAgent,
  downloadAsPDF,
  downloadAsTxt,
  buildMailtoLink
} from "@/lib/agent-output";
import { DocumentPreview } from "./document-preview";

interface LogEntry {
  id: string;
  _id?: string; // MongoDB document ID
  timestamp: Date;
  agentName: string;
  agentRole: string;
  type: "thinking" | "action" | "output" | "error" | "complete";
  message: string;
  details?: string;
  outputType?: string;
}


export function ActivityLog() {
  const [task, setTask] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "thinking" | "action" | "output" | "error">("all");
  const [showFilters, setShowFilters] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { setStatus } = useAIStatus();
  const {
    nodes,
    connections,
    personality,
    agentRole,
    agentName: configAgentName,
    customInstructions,
    deployedConfig,
    outputType: globalOutputType
  } = usePipeline();

  const [previewConfig, setPreviewConfig] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    agentName: string;
    agentRole: string;
    timestamp: Date;
  }>({
    isOpen: false,
    title: "",
    content: "",
    agentName: "",
    agentRole: "",
    timestamp: new Date()
  });

  // Sync with global AI Status
  useEffect(() => {
    const hasError = logs.length > 0 && logs[logs.length - 1].type === "error";
    if (hasError) {
      setStatus("error");
    } else if (isSubmitting) {
      setStatus("processing");
    } else {
      setStatus("idle");
    }
  }, [isSubmitting, logs, setStatus]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Fetch logs on mount
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/logs`);
      const data = await response.json();
      // Ensure timestamps are Date objects
      const formattedLogs = data.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
      setLogs(formattedLogs);
    } catch (error) {
      console.warn("Activity log server offline or starting up.", error instanceof Error ? error.message : String(error));
    }
  };

  const addLog = async (logData: Omit<LogEntry, "id">) => {
    // Generate a temporary local ID with random suffix to ensure uniqueness
    const tempLog = { ...logData, id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` } as LogEntry;

    // Update local UI immediately for responsiveness
    setLogs(prev => [...prev, tempLog]);

    try {
      // Save to cloud
      const response = await fetch(`/api/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData)
      });
      const savedLog = await response.json();

      // Optionally update the local log with the real DB _id if needed
      // setLogs(prev => prev.map(l => l.id === tempLog.id ? { ...savedLog, id: savedLog._id } : l));
    } catch (error) {
      console.error("Error saving log to cloud:", error);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = task.trim();
    if (!prompt || isSubmitting) return;

    setTask("");
    setIsSubmitting(true);
    const requestStartTime = Date.now();

    // 1. Log the task assignment
    const taskLog: Omit<LogEntry, "id"> = {
      timestamp: new Date(),
      agentName: "System",
      agentRole: "Task Manager",
      type: "action",
      message: `New task assigned: "${prompt}"`,
      details: "Sending to Gemini AI for processing..."
    };
    addLog(taskLog);

    // 2. Log a thinking entry
    let activeAgentName = "Gemini Agent";
    let activeAgentRole = "AI Processor";

    if (deployedConfig === "agent") {
      activeAgentName = configAgentName || "Custom Agent";
      activeAgentRole = agentRole || "Custom Role";
    } else if (deployedConfig === "pipeline" && nodes.length > 0) {
      // Use the first node in the pipeline as the active responder
      activeAgentName = nodes[0].name;
      activeAgentRole = nodes[0].role;
    }

    const thinkingLog: Omit<LogEntry, "id"> = {
      timestamp: new Date(),
      agentName: activeAgentName,
      agentRole: activeAgentRole,
      type: "thinking",
      message: "Analysing task and generating response...",
      details: `Processing: "${prompt}"`
    };
    addLog(thinkingLog);

    try {
      const pipelineDesc = buildPipelineDescription(nodes, connections);

      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          agentName: activeAgentName,
          agentRole: activeAgentRole,
          personality,
          pipelineContext: pipelineDesc,
          customInstructions
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const responseTime = ((Date.now() - requestStartTime) / 1000).toFixed(1);

        // 3. Log the successful Gemini response as output
        const outputLog: Omit<LogEntry, "id"> = {
          timestamp: new Date(),
          agentName: activeAgentName,
          agentRole: activeAgentRole,
          type: "output",
          message: `Task completed in ${responseTime}s — Gemini response received`,
          details: data.response,
          outputType: globalOutputType,
        };
        addLog(outputLog);

        // Auto-open the premium preview immediately
        setPreviewConfig({
          isOpen: true,
          title: "Generated Document",
          content: data.response || "",
          agentName: activeAgentName,
          agentRole: activeAgentRole,
          timestamp: new Date()
        });

        // 4. Log a completion entry
        const completeLog: Omit<LogEntry, "id"> = {
          timestamp: new Date(),
          agentName: "System",
          agentRole: "Task Manager",
          type: "complete",
          message: "Task processed successfully",
          details: `Personality: ${personality} · Pipeline: ${pipelineDesc || "Standalone"}`
        };
        addLog(completeLog);
      } else {
        const errorLog: Omit<LogEntry, "id"> = {
          timestamp: new Date(),
          agentName: "System",
          agentRole: "Task Manager",
          type: "error",
          message: "Failed to get a response from Gemini",
          details: data.error ?? "Unknown error"
        };
        addLog(errorLog);
      }
    } catch {
      const errorLog: Omit<LogEntry, "id"> = {
        timestamp: new Date(),
        agentName: "System",
        agentRole: "Task Manager",
        type: "error",
        message: "Could not reach the Express server on port 3001",
        details: "Make sure the backend is running: nodemon server.js"
      };
      addLog(errorLog);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearLogs = useCallback(async () => {
    try {
      await fetch(`/api/logs`, { method: "DELETE" });
      setLogs([]);
    } catch (error) {
      console.warn("Activity log server offline or starting up.", error instanceof Error ? error.message : String(error));
    }
  }, []);

  const getTypeIcon = useCallback((type: LogEntry["type"]) => {
    switch (type) {
      case "thinking":
        return <Lightbulb className="w-4 h-4" />;
      case "action":
        return <Zap className="w-4 h-4" />;
      case "output":
        return <FileOutput className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      case "complete":
        return <CheckCircle2 className="w-4 h-4" />;
    }
  }, []);

  const getTypeColor = useCallback((type: LogEntry["type"]) => {
    switch (type) {
      case "thinking":
        return "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30";
      case "action":
        return "text-[#E65100] bg-[#E65100]/10 border-[#E65100]/30";
      case "output":
        return "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30";
      case "error":
        return "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30";
      case "complete":
        return "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30";
    }
  }, []);

  const getTypeBadgeColor = useCallback((type: LogEntry["type"]) => {
    switch (type) {
      case "thinking":
        return "bg-[#D4AF37]/20 text-[#D4AF37]";
      case "action":
        return "bg-[#E65100]/20 text-[#E65100]";
      case "output":
        return "bg-[#10B981]/20 text-[#10B981]";
      case "error":
        return "bg-[#EF4444]/20 text-[#EF4444]";
      case "complete":
        return "bg-[#10B981]/20 text-[#10B981]";
    }
  }, []);

  const filteredLogs = useMemo(() => {
    return filter === "all"
      ? logs
      : logs.filter(log => log.type === filter);
  }, [logs, filter]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Task Input Section */}
      <div className="shrink-0 p-6 border-b border-[#D4AF37]/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-[#E6E6E6]">
            Assign New Task
          </h2>
          {deployedConfig ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-500 font-bold tracking-wider uppercase">
                Active: {deployedConfig === "agent" ? "Custom Agent" : "Pipeline Workflow"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#E65100]/10 border border-[#E65100]/30 rounded-full">
              <AlertCircle className="w-3 h-3 text-[#E65100]" />
              <span className="text-[10px] text-[#E65100] font-bold tracking-wider uppercase">
                No active Deployment
              </span>
            </div>
          )}
        </div>
        {!deployedConfig && (
          <div className="mb-4 p-3 bg-[#E65100]/5 border border-[#E65100]/20 rounded-lg">
            <p className="text-xs text-[#E65100]">
              Please **Create Agent** in the builder or **Deploy** a pipeline to start assigning tasks.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmitTask} className="space-y-4">
          <div className="relative">
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe the goal you want your agents to accomplish..."
              className="w-full h-24 px-4 py-3 bg-[#0D1117] border border-[#D4AF37]/30 rounded-lg text-[#E6E6E6] placeholder-[#6B7280] font-sans text-sm resize-none focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className="text-xs text-[#6B7280]">
                {task.length}/500
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
              <Bot className="w-4 h-4 text-[#D4AF37]" />
              <span>
                {deployedConfig === "agent" ? `${configAgentName} Ready`
                  : deployedConfig === "pipeline" ? `${nodes.length} Agents Wired`
                    : "No Context"}
              </span>
            </div>
            <button
              type="submit"
              disabled={!task.trim() || isSubmitting || !deployedConfig}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg font-serif font-medium text-sm transition-all duration-200",
                task.trim() && !isSubmitting && deployedConfig
                  ? "bg-[#E65100] text-[#E6E6E6] hover:bg-[#E65100]/90 shadow-lg shadow-[#E65100]/20"
                  : "bg-[#16211E] text-[#6B7280] cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Assign Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Activity Feed Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#D4AF37]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-lg font-semibold text-[#E6E6E6]">
            Live Activity Feed
          </h2>
          {isSubmitting && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-[#10B981]/10 rounded-full">
              <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
              <span className="text-xs text-[#10B981] font-medium">Live</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-[#0D1117] border border-[#D4AF37]/30 rounded-lg text-[#E6E6E6] text-sm hover:border-[#D4AF37]/50 transition-colors"
            >
              <Filter className="w-4 h-4 text-[#D4AF37]" />
              <span className="capitalize">{filter}</span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                showFilters && "rotate-180"
              )} />
            </button>
            {showFilters && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-[#16211E] border border-[#D4AF37]/30 rounded-lg shadow-xl z-10 overflow-hidden">
                {["all", "thinking", "action", "output", "error"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilter(type as typeof filter);
                      setShowFilters(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm capitalize transition-colors",
                      filter === type
                        ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "text-[#E6E6E6] hover:bg-[#0D1117]"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear */}
          <button
            onClick={clearLogs}
            className="p-2 rounded-lg border border-[#D4AF37]/30 text-[#9CA3AF] hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Activity Feed */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-3"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-[#D4AF37]/30 mb-4" />
            <p className="text-[#9CA3AF] font-sans">No activity logs yet</p>
            <p className="text-[#6B7280] text-sm font-sans mt-1">
              Assign a task to see agent activity
            </p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={log._id || log.id || `fallback-${index}`}
              className={cn(
                "p-4 rounded-lg border transition-all duration-300",
                getTypeColor(log.type),
                index === filteredLogs.length - 1 && "ring-1 ring-[#D4AF37]/30"
              )}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <div className="flex items-start gap-3">
                {/* Type Icon */}
                <div className={cn(
                  "p-2 rounded-lg",
                  getTypeBadgeColor(log.type)
                )}>
                  {getTypeIcon(log.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif font-semibold text-[#E6E6E6]">
                      {log.agentName}
                    </span>
                    <span className="text-xs text-[#6B7280] font-sans">
                      {log.agentRole}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium capitalize",
                      getTypeBadgeColor(log.type)
                    )}>
                      {log.type}
                    </span>
                  </div>
                  <p className="text-[#E6E6E6] font-sans text-sm mb-1">
                    {log.message}
                  </p>
                  {log.details && (
                    <div className="mt-2">
                      {log.type === "output" ? (
                        <div className="space-y-3">
                          <MarkdownOutput content={log.details} />

                          {/* Premium Preview Button (Replacing old download buttons) */}
                          <div className="pt-2">
                            <button
                              onClick={() => setPreviewConfig({
                                isOpen: true,
                                title: log.message.includes(":") ? log.message.split(":")[1].trim() : "Generated Document",
                                content: log.details || "",
                                agentName: log.agentName,
                                agentRole: log.agentRole,
                                timestamp: log.timestamp
                              })}
                              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/20 text-xs font-bold transition-all hover:scale-[1.02] tracking-wide"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              VIEW & EXPORT PREMIUM DOCUMENT
                            </button>

                            {/* Small hint for file type */}
                            <p className="mt-2 text-[9px] text-[#6B7280] font-sans flex items-center gap-1 opacity-70">
                              <Sparkles className="w-2.5 h-2.5" />
                              Ready to export as {log.outputType === 'pdf' ? 'Premium PDF' :
                                log.outputType === 'txt' ? 'Plain Text' :
                                  log.outputType === 'email' ? 'Email Digest' : 'Standard Document'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#9CA3AF] font-sans text-xs">
                          {log.details}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1 text-xs text-[#6B7280] whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {formatTime(log.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator when submitting */}
        {isSubmitting && filteredLogs.length > 0 && (
          <div className="p-4 rounded-lg border border-[#D4AF37]/30 bg-[#16211E]/50 mt-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-3 bg-[#D4AF37]/20 rounded" />
                  <div className="w-16 h-2 bg-[#6B7280]/30 rounded" />
                </div>
                <div className="w-48 h-3 bg-[#E6E6E6]/20 rounded" />
              </div>
            </div>
            <div className="space-y-2 ml-11">
              <div className="w-full h-2.5 bg-[#6B7280]/20 rounded" />
              <div className="w-5/6 h-2.5 bg-[#6B7280]/20 rounded" />
              <div className="w-4/6 h-2.5 bg-[#6B7280]/20 rounded" />
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-3 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs text-[#6B7280]">
        <div className="flex items-center gap-4">
          <span>{logs.length} total entries</span>
          <span>{logs.filter(l => l.type === "complete").length} completed</span>
          <span>{logs.filter(l => l.type === "error").length} errors</span>
        </div>
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-[#D4AF37]" />
          <span>Powered by Sutradhar.AI</span>
        </div>
      </div>

      {/* Premium Document Preview Modal */}
      <DocumentPreview
        isOpen={previewConfig.isOpen}
        onClose={() => setPreviewConfig(prev => ({ ...prev, isOpen: false }))}
        title={previewConfig.title}
        content={previewConfig.content}
        agentName={previewConfig.agentName}
        agentRole={previewConfig.agentRole}
        timestamp={previewConfig.timestamp}
      />
    </div>
  );
}
