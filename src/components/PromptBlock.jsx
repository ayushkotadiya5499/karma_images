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
    <div className="relative mt-4 bg-slate-50 border border-orange-100/70 rounded-xl overflow-hidden shadow-xs">
      {/* Mock IDE Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/80 border-b border-slate-200/60">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-[11px] text-slate-400 font-mono ml-2 select-none">AI Prompt Box</span>
        </div>

        <button
          onClick={copyPrompt}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
            copied
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-white text-slate-500 border-slate-200 hover:text-orange-600 hover:bg-orange-50/20 hover:border-orange-200"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
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
        <pre className="prompt-font text-[14px] leading-relaxed text-[#c2410c]/90 font-medium whitespace-pre-wrap">
          {prompt.trim()}
        </pre>
      </div>
    </div>
  );
}
