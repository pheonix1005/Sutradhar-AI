"use client";

import React, { useEffect } from "react";
import { useAIStatus } from "@/hooks/use-ai-status";

export function AIStatusIndicator() {
    const { status } = useAIStatus();

    // Status to color mapping
    const statusColors = {
        idle: "#E6E6E6",      // Grey
        processing: "#D4AF37", // Gold
        error: "#E65100",     // Red
    };

    const currentColor = statusColors[status];

    // Update Favicon dynamically
    useEffect(() => {
        // We create a tiny SVG of a colored circle
        const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="${currentColor}" />
      </svg>
    `.trim();

        const dataUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;

        // Try to find an existing favicon or create a new one
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
        }

        // Set the href to the generated SVG
        link.href = dataUrl;

        // Specifically handle Safari/Apple touch icon just in case
        let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
        if (appleLink) {
            appleLink.href = dataUrl;
        }

    }, [currentColor]);

    return (
        <div
            className="fixed bottom-6 left-6 z-[100] flex items-center justify-center p-3 rounded-full bg-[#16211E] border border-[#D4AF37]/30 shadow-lg group cursor-help transition-all hover:scale-105"
            title={`AI Status: ${status}`}
        >
            <div className="relative flex items-center justify-center w-5 h-5">
                {/* Pulsing effect for processing */}
                {status === "processing" && (
                    <span
                        className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"
                        style={{ backgroundColor: currentColor }}
                    />
                )}
                {/* Core dot */}
                <span
                    className="relative inline-flex w-3 h-3 rounded-full shadow-sm"
                    style={{
                        backgroundColor: currentColor,
                        boxShadow: `0 0 8px ${currentColor}80` // Soft glow
                    }}
                />
            </div>

            {/* Tooltip on hover */}
            <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium text-[#E6E6E6] bg-[#0D1117] border border-[#D4AF37]/30 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                AI {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        </div>
    );
}
