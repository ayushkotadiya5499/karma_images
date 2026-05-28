import { CheckCircle2, Circle, GraduationCap } from "lucide-react";
import SearchBar from "./SearchBar";

export default function Sidebar({
  chapters,
  active,
  setActive,
  searchQuery,
  setSearchQuery,
  completedChapters,
  toggleChapterCompleted,
}) {
  const totalChapters = chapters.length;
  const completedCount = completedChapters.length;
  const percentComplete = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  return (
    <div className="w-80 h-screen flex flex-col bg-[#fff7ed] border-r border-orange-100/80 shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-orange-100/50">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-1.5 bg-orange-500/10 rounded-xl text-orange-600 border border-orange-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-wide text-slate-800">KARMA IMAGE</span>
        </div>
        <p className="text-xs text-slate-500 font-medium">The Ultimate FB Engagement Blueprint</p>
      </div>

      {/* Progress Hub */}
      <div className="px-6 py-4 bg-orange-100/20 border-b border-orange-100/40">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-500">OVERALL PROGRESS</span>
          <span className="text-orange-600 font-mono">{percentComplete}% ({completedCount}/{totalChapters})</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden border border-slate-300/10">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Search Container */}
      <div className="px-5 pt-4">
        <SearchBar query={searchQuery} setQuery={setSearchQuery} />
      </div>

      {/* Scrollable Chapter List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2.5">
        {chapters.map((chapter) => {
          const isSelected = active.id === chapter.id;
          const isCompleted = completedChapters.includes(chapter.id);

          return (
            <button
              key={chapter.id}
              onClick={() => setActive(chapter)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 select-none cursor-pointer flex items-center justify-between gap-3 shadow-xs ${
                isSelected
                  ? "bg-white text-orange-800 border-orange-300 shadow-sm shadow-orange-500/5 font-semibold"
                  : "bg-white/45 text-slate-600 border-orange-100/40 hover:text-slate-900 hover:bg-white/85 hover:border-orange-200/50"
              }`}
            >
              <span className="text-sm leading-snug tracking-wide line-clamp-2">
                {chapter.title}
              </span>
              {isCompleted && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
            </button>
          );
        })}

        {chapters.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No modules found</p>
            <p className="text-xs mt-1">Try another search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
