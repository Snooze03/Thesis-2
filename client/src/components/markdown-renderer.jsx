import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer = ({ content, className = "" }) => {
    // Function to preprocess markdown content to fix numbering issues
    const preprocessMarkdown = (content) => {
        // Split content into lines for processing
        const lines = content.split('\n');
        const processedLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if this line looks like a numbered item that's NOT part of a real list
            // (i.e., it's followed by content on the same line rather than being a standalone list item)
            const numberedLineMatch = line.match(/^(\d+)\.\s+(.+)$/);

            if (numberedLineMatch) {
                const [, number, content] = numberedLineMatch;

                // Check if the next line looks like it continues this item (doesn't start with a number)
                // or if this line contains substantial content (likely not a list)
                const nextLine = lines[i + 1];
                const hasSubstantialContent = content.length > 30; // Arbitrary threshold
                const nextLineIsNotNumbered = !nextLine || !nextLine.match(/^\d+\.\s+/);

                if (hasSubstantialContent || (nextLineIsNotNumbered && content.includes('**'))) {
                    // This looks like a standalone numbered item, not a list
                    // Add escaping to prevent list interpretation
                    processedLines.push(`${number}\\. ${content}`);
                } else {
                    // This looks like a real list item, keep it as is
                    processedLines.push(line);
                }
            } else {
                processedLines.push(line);
            }
        }

        return processedLines.join('\n');
    };

    // Custom markdown components for better styling
    const markdownComponents = {
        // Custom paragraph styling
        p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,

        // Custom heading styles
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-medium mb-1 mt-2 first:mt-0">{children}</h3>,

        // Custom list styles - Keep spacing tight for real lists
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="ml-2">{children}</li>,

        // Custom code block styling
        code: ({ inline, children }) =>
            inline ? (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                </code>
            ) : (
                <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto">
                    {children}
                </code>
            ),

        // Custom blockquote styling
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-3 my-2 italic text-gray-700">
                {children}
            </blockquote>
        ),

        // Custom strong/bold styling
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,

        // Custom emphasis/italic styling
        em: ({ children }) => <em className="italic">{children}</em>,

        // Custom table styling for better appearance
        table: ({ children }) => (
            <table className="min-w-full border-collapse border border-gray-300 my-2">
                {children}
            </table>
        ),
        thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
        th: ({ children }) => (
            <th className="border border-gray-300 px-2 py-1 text-left font-semibold">
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td className="border border-gray-300 px-2 py-1">{children}</td>
        ),
    };

    return (
        <div className={`prose prose-sm max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
            >
                {preprocessMarkdown(content)}
            </ReactMarkdown>
        </div>
    );
};

export { MarkdownRenderer };