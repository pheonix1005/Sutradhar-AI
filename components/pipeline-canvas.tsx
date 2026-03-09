"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  Plus,
  ZoomIn,
  ZoomOut,
  Globe,
  FileText,
  Database,
  Mail,
  Bot,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Save,
  History,
  Layout
} from "lucide-react";

// Fixed dimensions for consistent positioning
const NODE_WIDTH = 180;
const NODE_HEIGHT = 130;
const HANDLE_RADIUS = 8;


import { usePipeline, AgentNode, Connection } from "@/lib/pipeline-context";

const iconComponents = {
  globe: Globe,
  file: FileText,
  database: Database,
  mail: Mail,
  bot: Bot,
};

const initialNodes: AgentNode[] = [
  { id: "1", name: "Research Agent", role: "Web Search", iconType: "globe", status: "completed", x: 80, y: 120 },
  { id: "2", name: "Summarizer", role: "Content Analysis", iconType: "file", status: "running", x: 340, y: 60 },
  { id: "3", name: "Data Processor", role: "Database Query", iconType: "database", status: "idle", x: 340, y: 280 },
  { id: "4", name: "Report Writer", role: "Document Gen", iconType: "bot", status: "idle", x: 600, y: 170 },
  { id: "5", name: "Email Handler", role: "Communication", iconType: "mail", status: "idle", x: 860, y: 170 },
];

const initialConnections: Connection[] = [
  { id: "c1", from: "1", to: "2" },
  { id: "c2", from: "1", to: "3" },
  { id: "c3", from: "2", to: "4" },
  { id: "c4", from: "3", to: "4" },
  { id: "c5", from: "4", to: "5" },
];

const nodeTemplates = [
  { name: "Web Search", role: "Research", iconType: "globe" as const },
  { name: "Summarizer", role: "Content Analysis", iconType: "file" as const },
  { name: "Data Processor", role: "Database Query", iconType: "database" as const },
  { name: "Email Handler", role: "Communication", iconType: "mail" as const },
  { name: "AI Assistant", role: "General Purpose", iconType: "bot" as const },
];

// Calculate handle positions based on node position
function getInputHandlePos(node: AgentNode) {
  return { x: node.x, y: node.y + NODE_HEIGHT / 2 };
}

function getOutputHandlePos(node: AgentNode) {
  return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 };
}

// Generate smooth bezier curve path
function generatePath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1);
  const cp = Math.max(60, dx * 0.5);
  return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
}

export function PipelineCanvas() {
  const { nodes, setNodes, connections, setConnections, setDeployedConfig } = usePipeline();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [savedPipelines, setSavedPipelines] = useState<any[]>([]);
  const [isLoadingPipelines, setIsLoadingPipelines] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pipelineName, setPipelineName] = useState("");

  // Sync initial data if context is empty
  useEffect(() => {
    if (nodes.length === 0 && connections.length === 0) {
      setNodes(initialNodes);
      setConnections(initialConnections);
    }
    fetchPipelines();
  }, []);

  const fetchPipelines = useCallback(async () => {
    setIsLoadingPipelines(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipelines`);
      const data = await response.json();
      setSavedPipelines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn("Pipeline server offline or starting up.", error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingPipelines(false);
    }
  }, []);

  const handleSavePipeline = useCallback(async () => {
    if (!pipelineName) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pipelineName,
          nodes,
          connections
        })
      });
      if (response.ok) {
        setPipelineName("");
        fetchPipelines();
      }
    } catch (error) {
      console.error("Error saving pipeline:", error);
    } finally {
      setIsSaving(false);
    }
  }, [pipelineName, nodes, connections, fetchPipelines]);

  const handleLoadPipeline = useCallback((pipeline: any) => {
    setNodes(pipeline.nodes);
    setConnections(pipeline.connections);
    setShowGallery(false);
  }, [setNodes, setConnections]);

  // Drag state using refs for performance
  const dragState = useRef<{
    nodeId: string | null;
    offsetX: number;
    offsetY: number;
  }>({ nodeId: null, offsetX: 0, offsetY: 0 });

  // Connection drawing state
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle node drag start
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if ((e.target as HTMLElement).closest(".handle")) return;
      e.preventDefault();
      e.stopPropagation();

      const node = nodes.find((n) => n.id === nodeId);
      if (!node || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoom / 100;

      dragState.current = {
        nodeId,
        offsetX: (e.clientX - rect.left) / scale - node.x,
        offsetY: (e.clientY - rect.top) / scale - node.y,
      };

      setSelectedNode(nodeId);
      setSelectedConnection(null);
    },
    [nodes, zoom]
  );

  // Handle output handle drag for connections
  const handleOutputMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const node = nodes.find((n) => n.id === nodeId);
      if (!node || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoom / 100;

      setConnectingFrom(nodeId);
      setMousePos({
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      });
    },
    [nodes, zoom]
  );

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoom / 100;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      // Handle node dragging
      if (dragState.current.nodeId) {
        const newX = Math.max(0, x - dragState.current.offsetX);
        const newY = Math.max(0, y - dragState.current.offsetY);

        setNodes((prev) =>
          prev.map((node) =>
            node.id === dragState.current.nodeId ? { ...node, x: newX, y: newY } : node
          )
        );
      }

      // Handle connection drawing
      if (connectingFrom) {
        setMousePos({ x, y });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // End node drag
      dragState.current.nodeId = null;

      // End connection - check if over an input handle
      if (connectingFrom && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const scale = zoom / 100;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        // Find target node by checking distance to input handle
        const targetNode = nodes.find((node) => {
          if (node.id === connectingFrom) return false;
          const handle = getInputHandlePos(node);
          const dist = Math.hypot(x - handle.x, y - handle.y);
          return dist < 25;
        });

        if (targetNode) {
          const exists = connections.some(
            (c) => c.from === connectingFrom && c.to === targetNode.id
          );
          if (!exists) {
            setConnections((prev) => [
              ...prev,
              { id: `c${Date.now()}`, from: connectingFrom, to: targetNode.id },
            ]);
          }
        }

        setConnectingFrom(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [connectingFrom, zoom, nodes, connections]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedConnection) {
          setConnections((prev) => prev.filter((c) => c.id !== selectedConnection));
          setSelectedConnection(null);
        } else if (selectedNode) {
          setConnections((prev) =>
            prev.filter((c) => c.from !== selectedNode && c.to !== selectedNode)
          );
          setNodes((prev) => prev.filter((n) => n.id !== selectedNode));
          setSelectedNode(null);
        }
      }
      if (e.key === "Escape") {
        setConnectingFrom(null);
        setSelectedNode(null);
        setSelectedConnection(null);
        setShowAddMenu(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, selectedConnection]);

  const handleAddNode = useCallback((template: (typeof nodeTemplates)[0]) => {
    const newNode: AgentNode = {
      id: `node-${Date.now()}`,
      name: template.name,
      role: template.role,
      iconType: template.iconType,
      status: "idle",
      x: 200 + Math.random() * 200,
      y: 150 + Math.random() * 100,
    };
    setNodes((prev) => [...prev, newNode]);
    setShowAddMenu(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedConnection) {
      setConnections((prev) => prev.filter((c) => c.id !== selectedConnection));
      setSelectedConnection(null);
    } else if (selectedNode) {
      setConnections((prev) =>
        prev.filter((c) => c.from !== selectedNode && c.to !== selectedNode)
      );
      setNodes((prev) => prev.filter((n) => n.id !== selectedNode));
      setSelectedNode(null);
    }
  }, [selectedNode, selectedConnection]);

  const statusColors = {
    idle: "bg-gray-500",
    running: "bg-[#E65100] animate-pulse",
    completed: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/20 bg-[#16211E]">
        <div>
          <h1 className="font-serif font-bold text-xl text-[#E6E6E6]">Multi-Agent Pipeline</h1>
          <p className="text-sm text-[#9CA3AF]">
            Drag nodes to move. Drag from gold handle to connect.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-[#0D1117] border border-[#D4AF37]/30 rounded-lg px-2 py-1">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1 text-[#9CA3AF] hover:text-[#D4AF37]"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#E6E6E6] w-10 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="p-1 text-[#9CA3AF] hover:text-[#D4AF37]"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Add Node */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0D1117] border border-[#D4AF37]/30 rounded-lg text-[#E6E6E6] hover:border-[#D4AF37] font-serif text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </button>

            {showAddMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#16211E] border border-[#D4AF37]/30 rounded-xl shadow-xl z-50">
                <div className="p-2 border-b border-[#D4AF37]/20">
                  <p className="text-xs text-[#9CA3AF] px-2">Select agent type</p>
                </div>
                {nodeTemplates.map((template) => {
                  const Icon = iconComponents[template.iconType];
                  return (
                    <button
                      key={template.name}
                      onClick={() => handleAddNode(template)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#D4AF37]/10"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#E6E6E6]">{template.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{template.role}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save & Gallery */}
          <div className="flex items-center gap-2 border-l border-[#D4AF37]/20 pl-4 ml-2">
            <div className="relative group/save">
              <input
                type="text"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="Workflow name..."
                className="bg-[#0D1117] border border-[#D4AF37]/30 rounded px-2 py-1.5 text-xs text-[#E6E6E6] focus:border-[#D4AF37] outline-none w-32"
              />
              <button
                onClick={handleSavePipeline}
                disabled={!pipelineName || isSaving}
                className="ml-1 p-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded text-[#D4AF37] hover:bg-[#D4AF37]/20 disabled:opacity-50"
                title="Save Workflow"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowGallery(!showGallery)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#16211E] border border-[#D4AF37]/30 rounded-lg text-[#D4AF37] hover:border-[#D4AF37]/60 text-xs font-serif font-semibold"
              >
                <History className="w-4 h-4" />
                Workflows
              </button>

              {showGallery && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-[#16211E] border border-[#D4AF37]/40 rounded-xl shadow-2xl z-[100] p-4 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D4AF37]/20">
                    <span className="text-xs font-serif font-bold text-[#E6E6E6]">Workflow History</span>
                    <button onClick={() => setShowGallery(false)}><X className="w-3 h-3 text-[#9CA3AF]" /></button>
                  </div>

                  {isLoadingPipelines ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mx-auto" /></div>
                  ) : savedPipelines.length === 0 ? (
                    <p className="text-[10px] text-[#6B7280] italic text-center py-4">No saved workflows found</p>
                  ) : (
                    <div className="space-y-2">
                      {savedPipelines.map((pipe) => (
                        <button
                          key={pipe._id}
                          onClick={() => handleLoadPipeline(pipe)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0D1117] border border-[#D4AF37]/10 hover:border-[#D4AF37]/50 transition-all text-left group"
                        >
                          <div className="w-8 h-8 rounded bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20">
                            <Layout className="w-4 h-4 text-[#D4AF37]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#E6E6E6] truncate">{pipe.name}</p>
                            <p className="text-[9px] text-[#6B7280]">{pipe.nodes.length} Nodes · {pipe.connections.length} Edges</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Delete */}
          {(selectedNode || selectedConnection) && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 font-serif text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}

          {/* Run/Deploy */}
          <button
            onClick={() => {
              setIsRunning(!isRunning);
              if (!isRunning) {
                setIsDeploying(true);
                setDeployedConfig("pipeline");
                setTimeout(() => {
                  setIsDeploying(false);
                  setIsDeployed(true);
                  setTimeout(() => setIsDeployed(false), 3000);
                }, 1000);
              } else {
                setDeployedConfig(null);
              }
            }}
            disabled={isDeploying}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-serif font-semibold text-sm transition-all ${isDeployed
              ? "bg-green-600 text-[#E6E6E6]"
              : isRunning
                ? "bg-[#E65100]/20 text-[#E65100] border border-[#E65100]"
                : "bg-[#E65100] text-[#E6E6E6]"
              } disabled:opacity-50`}
          >
            {isDeploying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isDeployed ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isRunning ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isDeploying ? "Deploying..." : isDeployed ? "Pipeline Active" : isRunning ? "Pause" : "Deploy & Run"}
          </button>
        </div>
      </div>

      {/* Connection hint banner */}
      {connectingFrom && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#16211E] border border-[#D4AF37]/50 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg">
          <span className="text-sm text-[#E6E6E6]">
            Release over an input handle (left side) to connect
          </span>
          <button
            onClick={() => setConnectingFrom(null)}
            className="text-[#9CA3AF] hover:text-[#E6E6E6]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-[#0D1117]"
        onClick={() => {
          setSelectedNode(null);
          setSelectedConnection(null);
        }}
      >
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `linear-gradient(to right, #D4AF37 1px, transparent 1px), linear-gradient(to bottom, #D4AF37 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Scalable content */}
        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {/* SVG Connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "200%", height: "200%", overflow: "visible" }}
          >
            <defs>
              <linearGradient id="connGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#E65100" />
              </linearGradient>
              <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E65100" />
                <stop offset="100%" stopColor="#FF6F00" />
              </linearGradient>
            </defs>

            {/* Existing connections */}
            {connections.map((conn) => {
              const fromNode = nodes.find((n) => n.id === conn.from);
              const toNode = nodes.find((n) => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              const start = getOutputHandlePos(fromNode);
              const end = getInputHandlePos(toNode);
              const path = generatePath(start.x, start.y, end.x, end.y);
              const isSelected = selectedConnection === conn.id;
              const isActive = fromNode.status === "running";

              return (
                <g key={conn.id}>
                  {/* Invisible wider hit area */}
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="20"
                    className="cursor-pointer pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConnection(conn.id);
                      setSelectedNode(null);
                    }}
                  />
                  {/* Visible path */}
                  <path
                    d={path}
                    fill="none"
                    stroke={isSelected ? "url(#selectedGradient)" : "url(#connGradient)"}
                    strokeWidth={isSelected ? 4 : 3}
                    strokeLinecap="round"
                    strokeDasharray={isActive ? "8 8" : "none"}
                    className={isActive ? "animate-dash" : ""}
                  />
                  {/* End dot */}
                  <circle cx={end.x} cy={end.y} r="5" fill={isSelected ? "#E65100" : "#D4AF37"} />
                </g>
              );
            })}

            {/* Temp connection line */}
            {connectingFrom && (() => {
              const fromNode = nodes.find((n) => n.id === connectingFrom);
              if (!fromNode) return null;
              const start = getOutputHandlePos(fromNode);
              const path = generatePath(start.x, start.y, mousePos.x, mousePos.y);
              return (
                <path
                  d={path}
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="3"
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              );
            })()}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const Icon = iconComponents[node.iconType];
            const isSelected = selectedNode === node.id;
            const isConnectTarget = connectingFrom && connectingFrom !== node.id;

            return (
              <div
                key={node.id}
                className={`absolute select-none transition-shadow ${isSelected ? "z-20" : "z-10"
                  }`}
                style={{
                  left: node.x,
                  top: node.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`w-full h-full rounded-xl border bg-[#16211E] p-4 cursor-grab active:cursor-grabbing ${isSelected
                    ? "border-[#E65100] shadow-lg shadow-[#E65100]/30"
                    : "border-[#D4AF37]/40 hover:border-[#D4AF37]"
                    }`}
                >
                  {/* Status dot */}
                  <div
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#16211E] ${statusColors[node.status]}`}
                  />

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-3">
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <h4 className="font-serif font-semibold text-[#E6E6E6] text-sm truncate">
                    {node.name}
                  </h4>
                  <p className="text-xs text-[#9CA3AF] truncate">{node.role}</p>
                </div>

                {/* Input handle (left) */}
                <div
                  className={`handle absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-[#0D1117] transition-transform ${isConnectTarget
                    ? "bg-[#E65100] scale-150 ring-4 ring-[#E65100]/30"
                    : "bg-[#D4AF37]/60 hover:bg-[#D4AF37]"
                    }`}
                  style={{
                    left: -HANDLE_RADIUS,
                    width: HANDLE_RADIUS * 2,
                    height: HANDLE_RADIUS * 2,
                  }}
                />

                {/* Output handle (right) */}
                <div
                  className="handle absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-[#0D1117] bg-[#D4AF37] cursor-crosshair hover:scale-125 hover:bg-[#E65100] transition-all"
                  style={{
                    right: -HANDLE_RADIUS,
                    width: HANDLE_RADIUS * 2,
                    height: HANDLE_RADIUS * 2,
                  }}
                  onMouseDown={(e) => handleOutputMouseDown(e, node.id)}
                />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-[#16211E]/95 backdrop-blur border border-[#D4AF37]/30 rounded-lg p-3 text-xs">
          <h4 className="font-serif text-[#D4AF37] mb-2">Controls</h4>
          <div className="space-y-1 text-[#9CA3AF]">
            <p>Drag node to move</p>
            <p>Drag gold handle to connect</p>
            <p>Click line to select</p>
            <p>Delete key to remove</p>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-4 right-4 bg-[#16211E]/95 backdrop-blur border border-[#D4AF37]/30 rounded-lg px-4 py-2">
          <span className="text-xs text-[#9CA3AF]">
            {nodes.length} nodes | {connections.length} connections
          </span>
        </div>
      </div>
    </div>
  );
}
