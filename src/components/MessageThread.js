import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
export default function MessageThread({ content }) {
    const html = useMemo(() => renderMarkdown(content), [content]);
    return (_jsx("div", { className: "prose-nexario text-sm text-text leading-relaxed", dangerouslySetInnerHTML: { __html: html } }));
}
// Lightweight markdown renderer — no external dependency
function renderMarkdown(md) {
    let html = md;
    // Escape HTML
    html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Bold + italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // Tables — detect | separator lines
    html = renderTables(html);
    // Blockquote
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    // Horizontal rule
    html = html.replace(/^---+$/gm, '<hr class="border-border my-3" />');
    // Unordered lists
    html = renderLists(html);
    // Paragraphs — wrap remaining bare lines
    html = html
        .split(/\n{2,}/)
        .map((block) => {
        const trimmed = block.trim();
        if (!trimmed)
            return '';
        // Don't wrap blocks that are already HTML tags
        if (/^<(h[1-6]|ul|ol|li|table|blockquote|hr|div|p)/.test(trimmed)) {
            return trimmed;
        }
        // Convert single newlines to <br> within a paragraph
        return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
        .filter(Boolean)
        .join('\n');
    return html;
}
function renderTables(html) {
    const lines = html.split('\n');
    const result = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i] ?? '';
        const next = lines[i + 1] ?? '';
        // Detect table: line with | and next line is separator (---|---)
        if (line.includes('|') && /^\|?[\s\-|:]+\|/.test(next)) {
            const tableLines = [line];
            i += 2; // skip separator
            while (i < lines.length && (lines[i] ?? '').includes('|')) {
                tableLines.push(lines[i] ?? '');
                i++;
            }
            const [headerLine, ...bodyLines] = tableLines;
            const headers = parseTableRow(headerLine ?? '');
            const rows = bodyLines.map(parseTableRow);
            let table = '<table><thead><tr>';
            headers.forEach((h) => { table += `<th>${h}</th>`; });
            table += '</tr></thead><tbody>';
            rows.forEach((row) => {
                table += '<tr>';
                row.forEach((cell) => { table += `<td>${cell}</td>`; });
                table += '</tr>';
            });
            table += '</tbody></table>';
            result.push(table);
        }
        else {
            result.push(line);
            i++;
        }
    }
    return result.join('\n');
}
function parseTableRow(line) {
    return line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());
}
function renderLists(html) {
    // Unordered lists: lines starting with - or * or •
    const lines = html.split('\n');
    const result = [];
    let inList = false;
    for (const line of lines) {
        const match = line.match(/^[\-\*•]\s+(.+)$/);
        if (match) {
            if (!inList) {
                result.push('<ul>');
                inList = true;
            }
            result.push(`<li>${match[1]}</li>`);
        }
        else {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            result.push(line);
        }
    }
    if (inList)
        result.push('</ul>');
    return result.join('\n');
}
