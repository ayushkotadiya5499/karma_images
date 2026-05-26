import { useState, useEffect } from "react";
import { Maximize2, Minimize2, CheckCircle2, ChevronRight, Menu } from "lucide-react";
import SectionCard from "./SectionCard";
import QuickRevisionCard from "./QuickRevisionCard";

export default function ChapterContent({
  chapter,
  searchQuery,
  completedChapters,
  toggleChapterCompleted,
  onMenuToggle, // callback for mobile responsive sidebar
}) {
  const [expandedSections, setExpandedSections] = useState({});
  const isCompleted = completedChapters.includes(chapter.id);

  // Initialize/reset section expansion state on chapter change
  useEffect(() => {
    const initialState = {};
    chapter.sections.forEach((_, idx) => {
      initialState[idx] = true;
    });
    setExpandedSections(initialState);
  }, [chapter]);

  // Auto-expand sections that match active search terms
  useEffect(() => {
    if (!searchQuery) return;
    const query = searchQuery.toLowerCase();
    
    setExpandedSections((prev) => {
      const nextState = { ...prev };
      chapter.sections.forEach((section, idx) => {
        const headingMatch = section.heading.toLowerCase().includes(query);
        const contentMatch = section.content && (
          Array.isArray(section.content)
            ? section.content.some((item) => item.toLowerCase().includes(query))
            : section.content.toLowerCase().includes(query)
        );
        const promptMatch = section.prompt && section.prompt.toLowerCase().includes(query);

        if (headingMatch || contentMatch || promptMatch) {
          nextState[idx] = true;
        }
      });
      return nextState;
    });
  }, [searchQuery, chapter]);

  const expandAll = () => {
    const nextState = {};
    chapter.sections.forEach((_, idx) => {
      nextState[idx] = true;
    });
    setExpandedSections(nextState);
  };

  const collapseAll = () => {
    const nextState = {};
    chapter.sections.forEach((_, idx) => {
      nextState[idx] = false;
    });
    setExpandedSections(nextState);
  };

  const toggleSection = (idx) => {
    setExpandedSections((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0b0f19]">
      {/* Top sticky header bar */}
      <header className="h-16 border-b border-slate-900/60 bg-[#0e1322]/80 backdrop-blur-md flex items-center justify-between px-6 md:px-10 shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Hamburger trigger for mobile */}
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 lg:hidden cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold tracking-wider uppercase font-mono">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-400">Module {chapter.id}</span>
          </div>
        </div>

        {/* Global Expand/Collapse toolbar */}
        <div className="flex items-center gap-3.5">
          <div className="hidden sm:flex items-center gap-2 border-r border-slate-800 pr-4">
            <button
              onClick={expandAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
              title="Expand all sections"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand All</span>
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
              title="Collapse all sections"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Collapse All</span>
            </button>
          </div>

          {/* Module Completion Toggle Pill */}
          <button
            onClick={() => toggleChapterCompleted(chapter.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer select-none ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/5"
                : "bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? "text-emerald-400 fill-current/10" : ""}`} />
            <span>{isCompleted ? "Completed" : "Mark Complete"}</span>
          </button>
        </div>
      </header>

      {/* Main content scroll container */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
        {/* Module Header Title Card */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3 uppercase tracking-widest font-mono">
            Chapter {chapter.id} OS Module
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-1 mb-3">
            {chapter.title}
          </h1>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-4xl">
            {chapter.description}
          </p>
        </div>

        {/* Quick Revision Stats Card */}
        <QuickRevisionCard chapterId={chapter.id} />

        {/* Dynamic Chapter Sections Accordion Grid */}
        <div className="space-y-4 max-w-5xl">
          {chapter.sections.map((section, idx) => (
            <SectionCard
              key={idx}
              index={idx}
              section={section}
              isOpen={!!expandedSections[idx]}
              onToggle={() => toggleSection(idx)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
