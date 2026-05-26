import React from 'react';

/**
 * An ultra-performant, highly styled custom Markdown renderer
 * tailormade for premium light-theme dashboards with perfect contrast.
 */
export function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Split content by paragraphs or double newlines
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className="space-y-4 text-slate-600 font-medium">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Horizontal Rule
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="my-6 border-t border-orange-100/80" />;
        }

        // 2. Table Parsing
        if (trimmed.startsWith('|') && trimmed.includes('\n|')) {
          const lines = trimmed.split('\n');
          const rows = lines.map(line => 
            line.split('|')
              .map(cell => cell.trim())
              .filter((_, i, arr) => i > 0 && i < arr.length - 1)
          );
          
          // Filter divider line (e.g. |---|---|)
          const cleanRows = rows.filter(row => !row.every(cell => cell.startsWith('-') || cell === ''));
          if (cleanRows.length === 0) return null;

          const header = cleanRows[0];
          const body = cleanRows.slice(1);

          return (
            <div key={idx} className="my-5 overflow-x-auto rounded-xl border border-orange-100 bg-orange-50/10 shadow-xs">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-orange-100 bg-orange-500/5">
                    {header && header.map((cell, cIdx) => (
                      <th key={cIdx} className="px-4 py-3 font-bold text-orange-700">
                        {renderText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100/50">
                  {body.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-orange-500/5 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-3 text-slate-700 font-medium">
                          {renderText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // 3. Blockquotes
        if (trimmed.startsWith('>')) {
          const lines = trimmed.split('\n').map(l => l.replace(/^>\s?/, ''));
          return (
            <blockquote key={idx} className="pl-4 my-4 border-l-4 border-orange-400 bg-orange-50/30 py-2.5 rounded-r-lg text-slate-600 italic font-medium">
              {lines.map((l, lIdx) => <p key={lIdx}>{renderText(l)}</p>)}
            </blockquote>
          );
        }

        // 4. Unordered Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').map(l => l.replace(/^[-*]\s?/, ''));
          return (
            <ul key={idx} className="space-y-2.5 my-3 pl-1">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2.5 text-sm md:text-base text-slate-600 leading-relaxed font-medium">
                  <span className="mt-1.5 text-orange-500 font-bold text-xs select-none">✦</span>
                  <span>{renderText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        // 5. Ordered Lists
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split('\n').map(l => l.replace(/^\d+\.\s?/, ''));
          return (
            <ol key={idx} className="space-y-2.5 my-3 pl-5 list-decimal text-sm md:text-base text-slate-600 leading-relaxed font-medium">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="pl-1">
                  <span>{renderText(item)}</span>
                </li>
              ))}
            </ol>
          );
        }

        // 6. Code Block within paragraph block
        if (trimmed.startsWith('```')) {
          const cleanText = trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
          return (
            <pre key={idx} className="my-4 p-4 rounded-xl font-mono text-xs overflow-x-auto bg-slate-50 border border-orange-100/60 text-[#c2410c] font-semibold shadow-inner">
              <code>{cleanText}</code>
            </pre>
          );
        }

        // 7. Headings
        if (trimmed.startsWith('#')) {
          const level = (trimmed.match(/^#+/) || ['#'])[0].length;
          const text = trimmed.replace(/^#+\s?/, '');
          const classes = level === 1 
            ? "text-xl md:text-2xl font-bold text-slate-800 mt-6 mb-3 border-b border-orange-100 pb-2" 
            : level === 2 
            ? "text-lg md:text-xl font-semibold text-slate-700 mt-5 mb-2.5" 
            : "text-base md:text-lg font-medium text-slate-600 mt-4 mb-2";
          return React.createElement(`h${Math.min(level, 6)}`, { key: idx, className: classes }, renderText(text));
        }

        // Default Paragraph
        return (
          <p key={idx} className="text-sm md:text-base text-slate-600 leading-relaxed font-medium my-2">
            {renderText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Helper to render bold, italics, and inline code formatting
function renderText(text) {
  if (typeof text !== 'string') return text;

  const parts = [];
  let index = 0;

  // Match bold (**text** or __text__), italic (*text* or _text_), inline code (`text`)
  const regex = /(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchText = match[1];
    const matchIndex = match.index;

    // Push preceding text
    if (matchIndex > index) {
      parts.push(text.substring(index, matchIndex));
    }

    if ((matchText.startsWith('**') && matchText.endsWith('**')) || 
        (matchText.startsWith('__') && matchText.endsWith('__'))) {
      parts.push(
        <strong key={matchIndex} className="font-bold text-orange-700">
          {matchText.slice(2, -2)}
        </strong>
      );
    } else if ((matchText.startsWith('*') && matchText.endsWith('*')) || 
               (matchText.startsWith('_') && matchText.endsWith('_'))) {
      parts.push(
        <em key={matchIndex} className="italic text-slate-700 font-semibold">
          {matchText.slice(1, -1)}
        </em>
      );
    } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
      parts.push(
        <code key={matchIndex} className="px-1.5 py-0.5 rounded text-xs font-mono bg-orange-50 text-[#c2410c] border border-orange-200/50">
          {matchText.slice(1, -1)}
        </code>
      );
    }

    index = regex.lastIndex;
  }

  if (index < text.length) {
    parts.push(text.substring(index));
  }

  return parts.length > 0 ? parts : text;
}
