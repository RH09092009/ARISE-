import React from 'react';

interface MarkdownProps {
  content: string;
}

// A very basic markdown formatter for bold and code blocks to avoid heavy dependencies
export const MarkdownRenderer: React.FC<MarkdownProps> = ({ content }) => {
  if (!content) return null;

  const parts = content.split(/(```[\s\S]*?```|\*\*.*?\*\*)/g);

  return (
    <span className="text-sm md:text-base leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const code = part.replace(/```[a-z]*\n?|```/g, '');
          return (
            <div key={index} className="my-4 p-4 bg-zinc-900 text-zinc-100 rounded-lg overflow-x-auto font-mono text-sm border border-zinc-700">
              <pre>{code}</pre>
            </div>
          );
        } else if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold text-brand-600 dark:text-brand-500">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};