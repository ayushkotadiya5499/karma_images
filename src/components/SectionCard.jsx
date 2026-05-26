import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, CheckCircle2 } from "lucide-react";
import PromptBlock from "./PromptBlock";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ImageShowcase } from "./ImageShowcase";

export default function SectionCard({ section, index, isOpen, onToggle }) {
  return (
    <div className="mb-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header (Accordion Toggle) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left bg-slate-900/10 hover:bg-slate-800/20 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="text-xs font-bold font-mono">{index + 1}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 tracking-wide">
            {section.heading}
          </h3>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="text-slate-500 hover:text-slate-300"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Expandable Content Panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-6 pt-1 border-t border-slate-900/30 bg-slate-900/5">
              {/* Main Content Area */}
              {section.markdown ? (
                <div className="mb-4">
                  <MarkdownRenderer content={section.markdown} />
                </div>
              ) : section.content ? (
                <div className="mb-4">
                  {Array.isArray(section.content) ? (
                    <ul className="space-y-2.5">
                      {section.content.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                          <span className="mt-1 text-indigo-400 font-bold text-xs select-none">✦</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                      {section.content}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Image / Gallery Showcase */}
              {(section.image || section.carousel) && (
                <ImageShowcase image={section.image} carousel={section.carousel} />
              )}

              {/* Prompt Block */}
              {section.prompt && (
                <div className="mt-4">
                  <PromptBlock prompt={section.prompt} />
                </div>
              )}

              {/* Tags/Badges Grid (Best For and Best Content) */}
              {(section.bestFor || section.bestContent) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800/40">
                  {/* Best For Tags */}
                  {section.bestFor && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-medium text-xs uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Best Suited For</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {section.bestFor.map((item, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-950/30 text-indigo-400 border border-indigo-500/20"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Best Content Tags */}
                  {section.bestContent && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Best Video Types</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {section.bestContent.map((item, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/30 text-emerald-400 border border-emerald-500/20"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
