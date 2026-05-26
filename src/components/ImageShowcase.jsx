import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ChevronLeft, ChevronRight, ExternalLink, Image as ImageIcon } from 'lucide-react';

export function ImageShowcase({ image, carousel }) {
  const isCarousel = Array.isArray(carousel) && carousel.length > 0;
  const imagesList = isCarousel ? carousel : image ? [image] : [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [imgErrors, setImgErrors] = useState({});

  if (imagesList.length === 0) return null;

  const currentImage = imagesList[currentIndex];

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % imagesList.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  const handleCopyPrompt = (e, promptText) => {
    e.stopPropagation();
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageError = (index) => {
    setImgErrors(prev => ({ ...prev, [index]: true }));
  };

  // Premium neon gradient placeholders for missing/dead image links
  const getGradientPlaceholder = (seed) => {
    const gradients = [
      'from-violet-600 via-indigo-700 to-cyan-500',
      'from-rose-500 via-fuchsia-600 to-indigo-500',
      'from-emerald-500 via-teal-600 to-cyan-500',
      'from-amber-500 via-orange-600 to-rose-500',
      'from-blue-600 via-purple-600 to-pink-500'
    ];
    const idx = Math.abs(seed) % gradients.length;
    return `bg-gradient-to-tr ${gradients[idx]}`;
  };

  return (
    <div className="relative group/showcase my-5 overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-950/20 backdrop-blur-md">
      {/* Visual Title / Meta Header */}
      <div className="flex items-center justify-between px-4.5 py-3 border-b border-slate-900/40 bg-slate-900/20">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isCarousel ? `Visual Gallery (${currentIndex + 1}/${imagesList.length})` : 'Visual Guide'}</span>
        </div>
        
        {currentImage.original_url && (
          <a
            href={currentImage.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            <span>HD Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Main Image Frame */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {imgErrors[currentIndex] ? (
            <motion.div
              key={`fallback-${currentIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`w-full h-full flex flex-col items-center justify-center p-6 text-center ${getGradientPlaceholder(currentIndex)}`}
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
              <div className="relative z-10 space-y-2">
                <ImageIcon className="w-10 h-10 text-white/80 mx-auto animate-pulse" />
                <p className="text-white font-semibold text-sm">DALL-E Concept Reference</p>
                <p className="text-white/60 text-xs font-mono max-w-md mx-auto line-clamp-2 px-4">
                  "{currentImage.query}"
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.img
              key={currentImage.url}
              src={currentImage.url}
              alt={currentImage.title || currentImage.query}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onError={() => handleImageError(currentIndex)}
              className="w-full h-full object-cover select-none transition-transform duration-700 hover:scale-105"
            />
          )}
        </AnimatePresence>

        {/* Ambient Dark Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

        {/* Copy Prompt Float Button */}
        {currentImage.query && (
          <button
            onClick={(e) => handleCopyPrompt(e, currentImage.query)}
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/85 hover:bg-indigo-600 text-slate-200 border border-slate-700/50 backdrop-blur-md transition-all shadow-lg active:scale-95"
            title="Copy image generation query"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-400 group-hover/showcase:text-white" />
                <span>Copy Query</span>
              </>
            )}
          </button>
        )}

        {/* Slider Navigation Buttons */}
        {isCarousel && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-slate-800/40 backdrop-blur-xs transition-all shadow-md hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-slate-800/40 backdrop-blur-xs transition-all shadow-md hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Description Overlay */}
      {currentImage.query && (
        <div className="p-4 bg-slate-950/80 border-t border-slate-900/50">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1.5">
            DALL-E Search Query / Prompt:
          </p>
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs md:text-sm font-mono text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40 flex-1 leading-relaxed">
              {currentImage.query}
            </p>
          </div>
          {currentImage.title && (
            <p className="text-[11px] text-slate-500 mt-2 italic font-normal">
              Reference Subject: {currentImage.title}
            </p>
          )}
        </div>
      )}

      {/* Carousel Dots Indicators */}
      {isCarousel && (
        <div className="flex justify-center gap-1.5 py-2.5 bg-slate-950 border-t border-slate-900/30">
          {imagesList.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'bg-indigo-500 w-4' 
                  : 'bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
