"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface AgentNode {
    id: string;
    name: string;
    role: string;
    iconType: "globe" | "file" | "database" | "mail" | "bot";
    status: "idle" | "running" | "completed" | "error";
    x: number;
    y: number;
}

export interface Connection {
    id: string;
    from: string;
    to: string;
}

type SetStateAction<T> = T | ((prev: T) => T);

interface PipelineContextType {
    nodes: AgentNode[];
    connections: Connection[];
    personality: string;
    agentRole: string;
    agentName: string;
    customInstructions: string;
    deployedConfig: "agent" | "pipeline" | null;
    outputType: string;
    setNodes: (action: SetStateAction<AgentNode[]>) => void;
    setConnections: (action: SetStateAction<Connection[]>) => void;
    setPersonality: (p: string) => void;
    setAgentRole: (r: string) => void;
    setAgentName: (n: string) => void;
    setCustomInstructions: (i: string) => void;
    setDeployedConfig: (config: "agent" | "pipeline" | null) => void;
    setOutputType: (type: string) => void;
}

const PipelineContext = createContext<PipelineContextType>({
    nodes: [],
    connections: [],
    personality: "professional",
    agentRole: "",
    agentName: "",
    customInstructions: "",
    deployedConfig: null,
    outputType: "markdown",
    setNodes: () => { },
    setConnections: () => { },
    setPersonality: () => { },
    setAgentRole: () => { },
    setAgentName: () => { },
    setCustomInstructions: () => { },
    setDeployedConfig: () => { },
    setOutputType: () => { },
});

export function PipelineProvider({ children }: { children: ReactNode }) {
    const [nodes, setNodes] = useState<AgentNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [personality, setPersonality] = useState("professional");
    const [agentRole, setAgentRole] = useState("");
    const [agentName, setAgentName] = useState("");
    const [customInstructions, setCustomInstructions] = useState("");
    const [deployedConfig, setDeployedConfig] = useState<"agent" | "pipeline" | null>(null);
    const [outputType, setOutputType] = useState("markdown");

    return (
        <PipelineContext.Provider
            value={{
                nodes,
                connections,
                personality,
                agentRole,
                agentName,
                customInstructions,
                deployedConfig,
                outputType,
                setNodes,
                setConnections,
                setPersonality,
                setAgentRole,
                setAgentName,
                setCustomInstructions,
                setDeployedConfig,
                setOutputType,
            }}
        >
            {children}
        </PipelineContext.Provider>
    );
}

export function usePipeline() {
    return useContext(PipelineContext);
}

/** Build a readable pipeline description from nodes + connections */
export function buildPipelineDescription(
    nodes: AgentNode[],
    connections: Connection[]
): string {
    if (nodes.length === 0) return "standalone agent";

    // Topological sort to get the pipeline order
    const inDegree: Record<string, number> = {};
    nodes.forEach((n) => (inDegree[n.id] = 0));
    connections.forEach((c) => {
        inDegree[c.to] = (inDegree[c.to] || 0) + 1;
    });

    const queue = nodes
        .filter((n) => inDegree[n.id] === 0)
        .map((n) => n.id);
    const order: string[] = [];

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        order.push(nodeId);
        connections
            .filter((c) => c.from === nodeId)
            .forEach((c) => {
                inDegree[c.to]--;
                if (inDegree[c.to] === 0) queue.push(c.to);
            });
    }

    const nameById = Object.fromEntries(nodes.map((n) => [n.id, n.name]));
    return order
        .map((id) => nameById[id])
        .filter(Boolean)
        .join(" → ");
}
