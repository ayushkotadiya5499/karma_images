import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function PromptBlock({ prompt }) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-4 bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden shadow-inner">
      {/* Mock IDE Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/40 border-b border-slate-900/60">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          <span className="text-[11px] text-slate-500 font-mono ml-2 select-none">AI Prompt Box</span>
        </div>

        <button
          onClick={copyPrompt}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
            copied
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale-up" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Prompt</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto">
        <pre className="prompt-font text-[14px] leading-relaxed text-emerald-400/90 whitespace-pre-wrap">
          {prompt.trim()}
        </pre>
      </div>
    </div>
  );
}
