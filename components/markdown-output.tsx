"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownOutputProps {
    content: string;
}

export function MarkdownOutput({ content }: MarkdownOutputProps) {
    return (
        <div className="prose prose-invert max-w-none text-xs font-sans leading-relaxed">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="text-base font-serif font-bold text-[#E6E6E6] mt-3 mb-1">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-sm font-serif font-semibold text-[#D4AF37] mt-2 mb-1">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-xs font-serif font-semibold text-[#E6E6E6] mt-2 mb-1">{children}</h3>
                    ),
                    p: ({ children }) => (
                        <p className="text-[#9CA3AF] mb-2 leading-relaxed">{children}</p>
                    ),
                    strong: ({ children }) => (
                        <strong className="text-[#E6E6E6] font-semibold">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="text-[#D4AF37] italic">{children}</em>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 my-2 text-[#9CA3AF]">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 my-2 text-[#9CA3AF]">{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-[#9CA3AF]">{children}</li>
                    ),
                    code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
                        inline ? (
                            <code className="bg-[#0D1117] text-[#D4AF37] px-1 py-0.5 rounded text-xs font-mono">
                                {children}
                            </code>
                        ) : (
                            <pre className="bg-[#0D1117] border border-[#D4AF37]/20 rounded-lg p-3 my-2 overflow-x-auto">
                                <code className="text-[#10B981] font-mono text-xs">{children}</code>
                            </pre>
                        ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-[#D4AF37]/50 pl-3 my-2 text-[#9CA3AF] italic">
                            {children}
                        </blockquote>
                    ),
                    hr: () => <hr className="border-[#D4AF37]/20 my-3" />,
                    a: ({ href, children }) => (
                        <a href={href} className="text-[#D4AF37] underline hover:text-[#E65100]" target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
