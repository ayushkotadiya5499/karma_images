import { CheckCircle2, ChevronRight, Menu } from "lucide-react";
import SectionCard from "./SectionCard";

export default function ChapterContent({
  chapter,
  completedChapters,
  toggleChapterCompleted,
  onMenuToggle, // callback for mobile responsive sidebar
}) {
  const isCompleted = completedChapters.includes(chapter.id);

  // Programmatic image de-duplication to prevent identical images from rendering repeatedly
  const renderedUrls = new Set();
  const cleanedSections = chapter.sections.map((section) => {
    let cleanImage = section.image;
    let cleanCarousel = section.carousel;

    if (cleanImage && cleanImage.url) {
      if (renderedUrls.has(cleanImage.url)) {
        cleanImage = null; // Suppress repeated image
      } else {
        renderedUrls.add(cleanImage.url);
      }
    }

    if (cleanCarousel && Array.isArray(cleanCarousel)) {
      const filteredCarousel = cleanCarousel.filter(img => {
        if (renderedUrls.has(img.url)) {
          return false;
        } else {
          renderedUrls.add(img.url);
          return true;
        }
      });
      cleanCarousel = filteredCarousel.length > 0 ? filteredCarousel : null;
    }

    return {
      ...section,
      image: cleanImage,
      carousel: cleanCarousel
    };
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#faf9f6]">
      {/* Top sticky header bar */}
      <header className="h-16 border-b border-orange-100/70 bg-white/85 backdrop-blur-md flex items-center justify-between px-6 md:px-10 shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Hamburger trigger for mobile */}
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-orange-50/60 lg:hidden cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold tracking-wider uppercase font-mono">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-orange-600">Chapter {chapter.id}</span>
          </div>
        </div>

        {/* Module Completion Toggle Pill */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => toggleChapterCompleted(chapter.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer select-none ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? "text-emerald-600 fill-current/5" : ""}`} />
            <span>{isCompleted ? "Completed" : "Mark Complete"}</span>
          </button>
        </div>
      </header>

      {/* Main content scroll container */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 scroll-smooth">
        {/* Module Header Title Card */}
        <div className="mb-10 max-w-4xl border-b border-orange-100/60 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20 mb-4 uppercase tracking-widest font-mono">
            Masterclass Topic {chapter.id}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 leading-tight">
            {chapter.title}
          </h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-3xl font-medium">
            {chapter.description}
          </p>
        </div>

        {/* Continuous Chapter Sections */}
        <div className="space-y-12 max-w-4xl pb-24">
          {cleanedSections.map((section, idx) => (
            <SectionCard
              key={idx}
              index={idx}
              section={section}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
