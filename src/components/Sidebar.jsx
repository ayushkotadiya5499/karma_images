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
  const percentComplete = Math.round((completedCount / totalChapters) * 100);

  return (
    <div className="w-80 h-screen flex flex-col bg-[#0e1322] border-r border-slate-900 shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-slate-900/80">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-1.5 bg-indigo-600/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-wide text-white">AI Creator OS</span>
        </div>
        <p className="text-xs text-slate-500 font-medium">The Ultimate FB Engagement Blueprint</p>
      </div>

      {/* Progress Hub */}
      <div className="px-6 py-4 bg-slate-950/20 border-b border-slate-900/60">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-400">OVERALL PROGRESS</span>
          <span className="text-indigo-400 font-mono">{percentComplete}% ({completedCount}/{totalChapters})</span>
        </div>
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
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
            <div
              key={chapter.id}
              className={`group relative rounded-xl border transition-all duration-300 ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/15"
                  : "bg-slate-900/40 text-slate-300 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700/60"
              }`}
            >
              <div className="flex items-start justify-between p-4 gap-3">
                {/* Chapter Metadata */}
                <button
                  onClick={() => setActive(chapter)}
                  className="flex-1 text-left cursor-pointer"
                >
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase font-mono ${
                      isSelected ? "text-indigo-200" : "text-indigo-400/80 group-hover:text-indigo-400"
                    }`}
                  >
                    Module {chapter.id}
                  </span>
                  
                  <h4 className="font-bold text-sm leading-snug mt-0.5 tracking-wide text-slate-100 group-hover:text-white transition-colors">
                    {chapter.title.replace(/^TYPE \d+\s*[—-]\s*/i, "")}
                  </h4>
                  
                  <p
                    className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${
                      isSelected ? "text-indigo-100" : "text-slate-400"
                    }`}
                  >
                    {chapter.description}
                  </p>
                </button>

                {/* Progress Toggle Badge */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChapterCompleted(chapter.id);
                  }}
                  className={`shrink-0 mt-1 cursor-pointer transition-colors ${
                    isCompleted
                      ? isSelected
                        ? "text-white hover:text-indigo-200"
                        : "text-emerald-500 hover:text-emerald-400"
                      : isSelected
                      ? "text-indigo-300 hover:text-white"
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                  title={isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 fill-current/10" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {chapters.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No modules found</p>
            <p className="text-xs mt-1">Try another search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
