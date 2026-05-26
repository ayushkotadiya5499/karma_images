import { Search, X } from "lucide-react";

export default function SearchBar({ query, setQuery }) {
  return (
    <div className="relative mb-5 w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4 text-orange-400/80" />
      </div>
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search keywords, prompts, formulas..."
        className="w-full pl-10 pr-10 py-2.5 bg-white border border-orange-100/80 rounded-xl text-sm placeholder-slate-400 text-slate-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300/40 transition-all font-sans shadow-xs"
      />

      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
