import { jsPDF } from "jspdf";

export type AgentOutputType = "markdown" | "pdf" | "txt" | "email";

/** Map pipeline agent role strings to their output type */
export function getOutputTypeForAgent(agentName: string): AgentOutputType {
    const name = agentName.toLowerCase();
    if (name.includes("summarizer")) return "pdf";
    if (name.includes("report")) return "txt";
    if (name.includes("email")) return "email";
    return "markdown";
}

/** Generate and trigger a PDF download from markdown-ish text */
export function downloadAsPDF(content: string, filename = "sutradhar-output.pdf") {
    const doc = new jsPDF({ format: "a4", unit: "mm" });

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const lineHeight = 6;
    let y = 20;

    // Strip markdown symbols for PDF-safe text
    const lines = content
        .replace(/#{1,3} /g, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`(.*?)`/g, "$1")
        .split("\n");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);

    for (const raw of lines) {
        const line = raw.trim();
        if (!line) { y += lineHeight * 0.5; continue; }

        const wrapped = doc.splitTextToSize(line, pageWidth);
        for (const wLine of wrapped) {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(wLine, margin, y);
            y += lineHeight;
        }
    }

    doc.save(filename);
}

/** Trigger a .txt download */
export function downloadAsTxt(content: string, filename = "sutradhar-report.txt") {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Build a mailto link for email agent output */
export function buildMailtoLink(content: string): string {
    const subject = encodeURIComponent("Sutradhar AI Report");
    const body = encodeURIComponent(content.slice(0, 1800)); // mailto body limit
    return `mailto:?subject=${subject}&body=${body}`;
}
