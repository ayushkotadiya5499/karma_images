import PromptBlock from "./PromptBlock";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ImageShowcase } from "./ImageShowcase";
import { Sparkles, CheckCircle2 } from "lucide-react";

export default function SectionCard({ section, index }) {
  return (
    <div className="section-block border-b border-orange-100/60 pb-10 last:border-b-0 last:pb-0">
      {/* Clean Step/Section Heading */}
      {section.heading && (
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-wide mb-5 flex items-center gap-3">
          <span className="text-xs font-bold font-mono px-2 py-1 bg-orange-500/10 text-orange-600 border border-orange-500/15 rounded-md shrink-0 select-none">
            Step {index + 1}
          </span>
          <span className="leading-snug">{section.heading}</span>
        </h2>
      )}

      {/* Main Content Area */}
      <div className="pl-0 md:pl-2">
        {section.markdown ? (
          <div className="mb-5">
            <MarkdownRenderer content={section.markdown} />
          </div>
        ) : section.content ? (
          <div className="mb-5">
            {Array.isArray(section.content) ? (
              <ul className="space-y-2.5">
                {section.content.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm md:text-base text-slate-600 leading-relaxed font-medium">
                    <span className="mt-1.5 text-orange-500 font-bold text-xs select-none">✦</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
                {section.content}
              </p>
            )}
          </div>
        ) : null}

        {/* Image / Gallery Showcase (Inline) */}
        {(section.image || section.carousel) && (
          <div className="my-6">
            <ImageShowcase image={section.image} carousel={section.carousel} />
          </div>
        )}

        {/* Prompt Block (Inline) */}
        {section.prompt && (
          <div className="my-5">
            <PromptBlock prompt={section.prompt} />
          </div>
        )}

        {/* Tags/Badges Grid (Best For and Best Content) */}
        {(section.bestFor || section.bestContent) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-orange-100/50">
            {/* Best For Tags */}
            {section.bestFor && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Best Suited For</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {section.bestFor.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200/60"
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
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Best Video Types</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {section.bestContent.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60"
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
    </div>
  );
}
