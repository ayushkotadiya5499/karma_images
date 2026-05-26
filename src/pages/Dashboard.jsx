import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import ChapterContent from "../components/ChapterContent";
import { chapters } from "../data/chapters";

export default function Dashboard() {
  const [active, setActive] = useState(chapters[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [completedChapters, setCompletedChapters] = useState(() => {
    try {
      const saved = localStorage.getItem("ai_creator_completed");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist completed chapters
  useEffect(() => {
    localStorage.setItem("ai_creator_completed", JSON.stringify(completedChapters));
  }, [completedChapters]);

  const toggleChapterCompleted = (id) => {
    setCompletedChapters((prev) =>
      prev.includes(id) ? prev.filter((chId) => chId !== id) : [...prev, id]
    );
  };

  // Full-text hierarchical search across titles, descriptions, section headings, body texts, and prompt code blocks.
  const filteredChapters = chapters.filter((chapter) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    const titleMatch = chapter.title.toLowerCase().includes(query);
    const descMatch = chapter.description.toLowerCase().includes(query);
    const sectionMatch = chapter.sections.some((sec) => {
      const headingMatch = sec.heading.toLowerCase().includes(query);
      const contentMatch =
        sec.content &&
        (Array.isArray(sec.content)
          ? sec.content.some((item) => item.toLowerCase().includes(query))
          : sec.content.toLowerCase().includes(query));
      const promptMatch = sec.prompt && sec.prompt.toLowerCase().includes(query);
      return headingMatch || contentMatch || promptMatch;
    });

    return titleMatch || descMatch || sectionMatch;
  });

  // Automatically update active chapter if the current selection gets filtered out
  useEffect(() => {
    if (filteredChapters.length > 0) {
      const isStillAvailable = filteredChapters.some((ch) => ch.id === active.id);
      if (!isStillAvailable) {
        setActive(filteredChapters[0]);
      }
    }
  }, [searchQuery, filteredChapters, active.id]);

  const handleSetActive = (chapter) => {
    setActive(chapter);
    setMobileMenuOpen(false); // auto-close drawer on selection
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 font-sans">
      {/* 1. Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          chapters={filteredChapters}
          active={active}
          setActive={handleSetActive}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          completedChapters={completedChapters}
          toggleChapterCompleted={toggleChapterCompleted}
        />
      </div>

      {/* 2. Mobile Navigation Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden cursor-pointer"
            />

            {/* Sliding Sidebar panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-80 z-50 lg:hidden shadow-2xl"
            >
              <Sidebar
                chapters={filteredChapters}
                active={active}
                setActive={handleSetActive}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                completedChapters={completedChapters}
                toggleChapterCompleted={toggleChapterCompleted}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Chapter Content Area */}
      <div className="flex-1 min-w-0">
        <ChapterContent
          chapter={active}
          searchQuery={searchQuery}
          completedChapters={completedChapters}
          toggleChapterCompleted={toggleChapterCompleted}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />
      </div>
    </div>
  );
}
