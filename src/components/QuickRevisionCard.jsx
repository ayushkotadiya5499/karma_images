import { Target, Sun, AlertTriangle, CheckSquare } from "lucide-react";

const revisionData = {
  1: {
    goal: "Emotional cinematic realism for storytelling pages",
    lighting: "Sunset golden hour, dramatic DSLR shadows, warm lamp light",
    avoid: "Shiny plastic fake skins, over-complex busy backgrounds",
    checklist: ["DSLR camera depth-of-field", "Genuine, relatable human emotions", "Believable Indian/local environments"]
  },
  2: {
    goal: "3D Pixar-style emotional family character reels",
    lighting: "Warm whimsical lighting, soft key lights, pastel ambient glow",
    avoid: "Dull flat colors, photorealistic skin textures, scary expressions",
    checklist: ["Vibrant, stylized color palette", "Expressive large storytelling eyes", "Heartwarming or moral family themes"]
  },
  3: {
    goal: "Youth-focused emotional anime aesthetic",
    lighting: "Dramatic cel-shaded sunlight, neon backlight, soft studio glow",
    avoid: "Western comic book details, dark gritty mud textures",
    checklist: ["Clean line-art details", "Vibrant stylized sky & cloudscapes", "Deep emotional facial expressions"]
  },
  4: {
    goal: "Immersive movie-style epic cinematography",
    lighting: "Anamorphic lens flares, high-contrast chiaroscuro, volumetric fog",
    avoid: "Flat bright daylight, amateur phone-camera compositions",
    checklist: ["Epic wide-angle compositions", "Moody color grading (teal & orange)", "High visual suspense & tension"]
  },
  5: {
    goal: "Atmospheric loneliness & deep emotional reflection",
    lighting: "Soft cool blue shadows, rainy window reflections, streetlamp fog",
    avoid: "Bright happy primary colors, highly energetic action scenes",
    checklist: ["Solitary character framing", "Melancholic color tones", "Strong emotional resonance"]
  },
  6: {
    goal: "Devotional Indian spiritual storytelling",
    lighting: "Divine ambient golden glows, ethereal spiritual rays",
    avoid: "Modern high-tech cities, plastic artificial statues",
    checklist: ["Devotional symbolic elements (flute, peacock feather)", "Serene character expressions", "Traditional ancient Indian aesthetics"]
  },
  7: {
    goal: "Premium advertisement and product mockups",
    lighting: "Sleek studio three-point lighting, clean metallic reflections",
    avoid: "Messy, cluttered backgrounds, cheap look-alike props",
    checklist: ["Ultra-sharp product render quality", "Minimalistic modern background", "Luxurious & high-end framing"]
  },
  8: {
    goal: "Stop-scroll Facebook thumbnail layout",
    lighting: "High-contrast rim lighting to pop the main subject",
    avoid: "Tiny unreadable details, neutral boring facial expressions",
    checklist: ["Single high-impact focal point", "Intense, extreme emotional hook", "Clear visual hierarchy from 50px size"]
  },
  9: {
    goal: "Advanced professional prompt engineering master",
    lighting: "Explicit multi-directional lighting syntax",
    avoid: "Word salad and contradictory prompt instructions",
    checklist: ["Clean bracketed parameter syntax", "Weight ratio optimization", "Effective negative prompt constraints"]
  },
  10: {
    goal: "Flawless AI character identity consistency",
    lighting: "Consistent scene-to-scene environmental lighting",
    avoid: "Changing facial features, random clothing changes",
    checklist: ["Unique name + exact descriptor combination", "Character seed / image-to-image reference", "Constant styling accessories"]
  },
  11: {
    goal: "Cinematic, high-retention reel animations",
    lighting: "Dynamic cinematic lighting transitions",
    avoid: "Static, non-moving plain slide decks",
    checklist: ["High-impact visual hook image", "Subtle camera pan or parallax effect", "Pacing synced precisely to voice beats"]
  },
  12: {
    goal: "High watch-completion viral reel framework",
    lighting: "Highly engaging and vibrant reel frames",
    avoid: "Slow intro hooks (must capture in under 3s)",
    checklist: ["Instant emotional attention hook", "Curiosity building middle section", "Satisfying, shareable final payoff"]
  },
  13: {
    goal: "Deep impact emotional storytelling formula",
    lighting: "Shadows changing from dark (pain) to light (hope)",
    avoid: "Weak narrative arc, lack of relatable characters",
    checklist: ["Establish relatable deep pain point", "Show authentic struggle & setback details", "Uplifting transformation climax"]
  },
  14: {
    goal: "Authentic, high-trust Sarvam AI voice narration",
    lighting: "N/A (Sound design & audio integration focus)",
    avoid: "Fast-paced robotic speech, monotone dry voice",
    checklist: ["Select localized natural accents", "Include breathing pauses & dramatic beats", "Mix regional phrases (Hinglish/local)"]
  },
  15: {
    goal: "Copyright-safe sustained Facebook growth",
    lighting: "N/A (Business & monetization strategy)",
    avoid: "Using copyrighted clips, sound tracks, or plain clones",
    checklist: ["100% original generated AI visuals", "Unique scripting with original voiceovers", "Diversified revenue (ads + sponsors + products)"]
  }
};

export default function QuickRevisionCard({ chapterId }) {
  const data = revisionData[chapterId] || revisionData[1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Goal Card */}
      <div className="glass-panel p-5 rounded-2xl glow-accent">
        <div className="flex items-center gap-3 mb-3 text-indigo-400">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <span className="font-semibold tracking-wide text-xs uppercase">Core Goal</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          {data.goal}
        </p>
      </div>

      {/* Lighting Card */}
      <div className="glass-panel p-5 rounded-2xl glow-accent">
        <div className="flex items-center gap-3 mb-3 text-amber-400">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Sun className="w-5 h-5" />
          </div>
          <span className="font-semibold tracking-wide text-xs uppercase">Best Lighting</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          {data.lighting}
        </p>
      </div>

      {/* Avoid Card */}
      <div className="glass-panel p-5 rounded-2xl glow-accent">
        <div className="flex items-center gap-3 mb-3 text-rose-400">
          <div className="p-2 bg-rose-500/10 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="font-semibold tracking-wide text-xs uppercase">Avoid (Mistake)</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          {data.avoid}
        </p>
      </div>

      {/* Checklist Card */}
      <div className="glass-panel p-5 rounded-2xl glow-accent">
        <div className="flex items-center gap-3 mb-3 text-emerald-400">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="font-semibold tracking-wide text-xs uppercase">Success Rules</span>
        </div>
        <ul className="text-xs text-slate-300 space-y-1.5 list-none pl-0">
          {data.checklist.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
