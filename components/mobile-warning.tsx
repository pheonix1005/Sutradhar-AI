"use client";

import { useEffect, useState } from "react";
import { Monitor, AlertTriangle } from "lucide-react";

export function MobileWarning() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const check = () => {
            setShow(window.innerWidth < 1024);
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0D1117] flex flex-col items-center justify-center px-8 text-center">
            {/* Subtle background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#E65100]/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Icon */}
            <div className="relative mb-8">
                <div className="w-20 h-20 rounded-2xl bg-[#16211E] border border-[#D4AF37]/40 flex items-center justify-center mx-auto">
                    <Monitor className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#E65100] rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                </div>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-2xl font-bold text-[#E6E6E6] tracking-tight mb-3">
                Designed for Desktop
            </h1>

            {/* Sutradhar brand mark */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E65100]" />
                <span className="text-xs text-[#D4AF37] font-serif tracking-widest uppercase">
                    Sutradhar.AI
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#E65100]" />
            </div>

            {/* Message */}
            <p className="font-sans text-[#9CA3AF] text-sm leading-relaxed max-w-xs mb-3">
                The Sutradhar AI Agent Builder requires a larger screen to use its visual pipeline canvas and drag-and-drop tools.
            </p>
            <p className="font-sans text-[#6B7280] text-xs">
                Please open this on a <span className="text-[#D4AF37] font-semibold">laptop or desktop monitor</span> for the best experience.
            </p>
        </div>
    );
}
