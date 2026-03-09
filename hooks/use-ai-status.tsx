"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type AIStatus = "idle" | "processing" | "error";

interface AIStatusContextProps {
    status: AIStatus;
    setStatus: (status: AIStatus) => void;
}

const AIStatusContext = createContext<AIStatusContextProps | undefined>(undefined);

export function AIStatusProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AIStatus>("idle");

    useEffect(() => {
        const statusColors = {
            idle: "#E6E6E6",      // Grey
            processing: "#D4AF37", // Gold
            error: "#E65100",     // Red
        };

        const currentColor = statusColors[status];
        const animation = status === "processing"
            ? `<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />`
            : "";

        const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="${currentColor}">
          ${animation}
        </circle>
      </svg>
    `.trim();

        const dataUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;

        document.querySelectorAll("link[rel~='icon']").forEach(e => e.remove());
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/svg+xml";
        link.href = dataUrl;
        document.head.appendChild(link);

        let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
        if (appleLink) {
            appleLink.href = dataUrl;
        }
    }, [status]);

    return (
        <AIStatusContext.Provider value={{ status, setStatus }}>
            {children}
        </AIStatusContext.Provider>
    );
}

export function useAIStatus() {
    const context = useContext(AIStatusContext);
    if (!context) {
        throw new Error("useAIStatus must be used within an AIStatusProvider");
    }
    return context;
}
