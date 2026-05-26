import React from 'react';

/**
 * A ultra-performant, highly styled custom Markdown renderer
 * tailormade for premium dark-theme dashboards.
 */
export function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Split content by paragraphs or double newlines
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className="space-y-4 text-slate-300">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Horizontal Rule
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="my-6 border-t border-slate-800/40" />;
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
            <div key={idx} className="my-5 overflow-x-auto rounded-xl border border-slate-800/30 bg-slate-950/20 backdrop-blur-sm">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-800/50 bg-indigo-950/10">
                    {header && header.map((cell, cIdx) => (
                      <th key={cIdx} className="px-4 py-3 font-semibold text-indigo-400">
                        {renderText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/30">
                  {body.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/10 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-3 text-slate-300 font-normal">
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
            <blockquote key={idx} className="pl-4 my-4 border-l-4 border-indigo-500 bg-slate-950/30 py-2.5 rounded-r-lg text-slate-400 italic font-normal">
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
                <li key={iIdx} className="flex items-start gap-2.5 text-sm md:text-base text-slate-300 leading-relaxed">
                  <span className="mt-1.5 text-indigo-500 font-bold text-xs select-none">✦</span>
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
            <ol key={idx} className="space-y-2.5 my-3 pl-5 list-decimal text-sm md:text-base text-slate-300 leading-relaxed font-normal">
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
            <pre key={idx} className="my-4 p-4 rounded-xl font-mono text-xs overflow-x-auto bg-slate-950/80 border border-slate-800/40 text-emerald-400">
              <code>{cleanText}</code>
            </pre>
          );
        }

        // 7. Headings
        if (trimmed.startsWith('#')) {
          const level = (trimmed.match(/^#+/) || ['#'])[0].length;
          const text = trimmed.replace(/^#+\s?/, '');
          const classes = level === 1 
            ? "text-xl md:text-2xl font-bold text-white mt-6 mb-3 border-b border-slate-800/30 pb-2" 
            : level === 2 
            ? "text-lg md:text-xl font-semibold text-slate-100 mt-5 mb-2.5" 
            : "text-base md:text-lg font-medium text-slate-200 mt-4 mb-2";
          return React.createElement(`h${Math.min(level, 6)}`, { key: idx, className: classes }, renderText(text));
        }

        // Default Paragraph
        return (
          <p key={idx} className="text-sm md:text-base text-slate-300 leading-relaxed font-normal my-2">
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
        <strong key={matchIndex} className="font-semibold text-indigo-300">
          {matchText.slice(2, -2)}
        </strong>
      );
    } else if ((matchText.startsWith('*') && matchText.endsWith('*')) || 
               (matchText.startsWith('_') && matchText.endsWith('_'))) {
      parts.push(
        <em key={matchIndex} className="italic text-slate-200">
          {matchText.slice(1, -1)}
        </em>
      );
    } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
      parts.push(
        <code key={matchIndex} className="px-1.5 py-0.5 rounded text-xs font-mono bg-indigo-950/40 text-indigo-400 border border-indigo-500/10">
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
