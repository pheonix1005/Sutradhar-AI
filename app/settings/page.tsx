import { Sidebar } from "@/components/sidebar";
import { Settings, Sparkles, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    return (
        <div className="flex h-screen bg-[#060908] text-[#E6E6E6] font-sans selection:bg-[#E65100]/30 overflow-hidden">
            <Sidebar activePage="settings" />

            <main className="flex-1 flex flex-col relative">
                {/* Subtle Background Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E65100]/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />

                {/* Header content */}
                <header className="px-8 py-6 border-b border-[#D4AF37]/10 flex justify-between items-center bg-[#0D1117]/80 backdrop-blur-md relative z-10">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-[#D4AF37] tracking-tight">Account & Settings</h1>
                        <p className="text-sm text-[#9CA3AF] mt-1">Manage your platform preferences and billing</p>
                    </div>
                </header>

                {/* Coming Soon Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                    <div className="max-w-2xl w-full bg-[#0D1117]/50 border border-[#D4AF37]/20 rounded-2xl p-12 text-center relative overflow-hidden group">

                        {/* Animated Gradient Border Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#E65100]/0 via-[#E65100]/10 to-[#E65100]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl pointer-events-none" />

                        <div className="mx-auto w-20 h-20 bg-[#16211E] border border-[#D4AF37]/50 rounded-2xl flex items-center justify-center mb-8 relative">
                            <div className="absolute -top-2 -right-2">
                                <Sparkles className="w-6 h-6 text-[#E65100] animate-pulse" />
                            </div>
                            <Settings className="w-10 h-10 text-[#D4AF37]" />
                        </div>

                        <h2 className="text-4xl font-serif font-bold text-[#E6E6E6] mb-4 tracking-tight">
                            Settings are <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#E65100]">Coming Soon</span>
                        </h2>

                        <p className="text-lg text-[#9CA3AF] mb-10 max-w-lg mx-auto leading-relaxed">
                            We're currently building out the administrative dashboard where you'll be able to manage billing, API keys, team access, and custom model deployments.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/"
                                className="flex items-center gap-2 bg-[#E65100] hover:bg-[#E65100]/90 text-white font-serif font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#E65100]/20 hover:-translate-y-0.5"
                            >
                                Return to Builder
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <div className="flex items-center gap-2 px-6 py-3 border border-[#D4AF37]/30 rounded-full text-[#9CA3AF] bg-[#16211E]/50">
                                <Clock className="w-4 h-4 text-[#D4AF37]" />
                                <span className="font-serif text-sm">Estimated arrival: Next Update</span>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
