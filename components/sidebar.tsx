"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  GitBranch,
  Activity,
  Settings,
  Menu,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SidebarProps {
  activePage?: string;
}

const navItems = [
  { id: "builder", label: "Agent Builder", icon: Bot, href: "/" },
  { id: "pipeline", label: "Pipeline", icon: GitBranch, href: "/pipeline" },
  { id: "activity", label: "Activity Log", icon: Activity, href: "/activity" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar({ activePage = "builder" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  return (
    <aside className={cn(
      "h-screen bg-[#16211E] border-r border-[#D4AF37]/30 flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
      isCollapsed ? "w-[72px]" : "w-64"
    )}>
      {/* Logo & Toggle */}
      <div className={cn(
        "border-b border-[#D4AF37]/30 flex shrink-0",
        isCollapsed ? "flex-col items-center py-4 gap-3" : "items-center p-4 gap-3"
      )}>
        {/* Logo Icon - always visible */}
        <div className="w-10 h-10 rounded-lg bg-[#E65100] shrink-0 flex items-center justify-center">
          <Bot className="w-6 h-6 text-[#E6E6E6]" />
        </div>

        {/* Brand text — only when expanded */}
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-lg font-bold text-[#E6E6E6] tracking-tight whitespace-nowrap">
              Sutradhar.AI
            </h1>
            <p className="text-xs text-[#9CA3AF]">AI Agent Platform</p>
          </div>
        )}

        {/* Toggle Button - always visible */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 rounded-lg text-[#9CA3AF] hover:bg-[#0D1117]/60 hover:text-[#E6E6E6] transition-colors flex items-center justify-center shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* New Agent Button */}
      <div className={cn(
        "shrink-0",
        isCollapsed ? "px-3 py-3 flex justify-center" : "p-4"
      )}>
        <button
          onClick={() => router.push("/")}
          className={cn(
            "flex items-center justify-center gap-2 bg-[#E65100] hover:bg-[#E65100]/90 text-[#E6E6E6] font-serif font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#E65100]/20",
            isCollapsed ? "w-10 h-10" : "w-full py-3 px-4"
          )}
          title={isCollapsed ? "New Agent" : undefined}
        >
          <Plus className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>New Agent</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg font-sans text-sm transition-all duration-200",
                    isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                    isActive
                      ? "bg-[#0D1117] text-[#D4AF37] border border-[#D4AF37]/50"
                      : "text-[#9CA3AF] hover:text-[#E6E6E6] hover:bg-[#0D1117]/50 border border-transparent"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 shrink-0",
                    isActive ? "text-[#D4AF37]" : "text-[#D4AF37]/60"
                  )} />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / User Avatar — always visible */}
      <div className={cn(
        "border-t border-[#D4AF37]/30 shrink-0",
        isCollapsed ? "p-3 flex justify-center" : "p-4"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          {/* Avatar - always visible */}
          <div
            className="w-9 h-9 rounded-full bg-[#E65100]/20 border border-[#D4AF37]/50 shrink-0 flex items-center justify-center"
            title={isCollapsed ? "Team Yurei" : undefined}
          >
            <span className="text-sm font-serif text-[#D4AF37]">TY</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#E6E6E6] truncate">Team Yurei</p>
              <p className="text-xs text-[#9CA3AF] truncate">Hackathon Mode</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
